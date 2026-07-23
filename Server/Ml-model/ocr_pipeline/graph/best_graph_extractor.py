import re
from typing import List
from datetime import datetime
from ocr_pipeline.graph.base_graph_extractor import BaseGraphExtractor
from ocr_pipeline.graph.graph_registry import GraphRegistry
from ocr_pipeline.models.bill_schema import PaymentHistoryItem

@GraphRegistry.register
class BestGraphExtractor(BaseGraphExtractor):
    """
    Dedicated Graph Extractor for BEST Electricity Bills.
    Extracts past consumption bar graph entries (e.g. '331 Jun-26', '206 May-26', '276 = Apr-26').
    Handles OCR noise digits, flexible OCR separators (=, :, |), and prevents year bleed-through.
    """

    @property
    def provider_key(self) -> str:
        return "best"

    def extract_history(self, text: str, page_image=None, bill_date_str: str = "") -> List[PaymentHistoryItem]:
        text_unit_map = {}

        # Detect current bill month to exclude it from history
        curr_bill_month = ""
        bill_m = re.search(r'Bill\s*For\s*[:\-]?\s*([A-Za-z]{3})[-\s]*(\d{2,4})', text, re.IGNORECASE)
        if not bill_m:
            bill_m = re.search(r'Electricity\s*Bill\s*for\s*Month\s*of\s*([A-Za-z]{3,9})\s*(\d{2,4})', text, re.IGNORECASE)
        if bill_m:
            curr_bill_month = f"{bill_m.group(1)[:3].lower()}-{bill_m.group(2)[-2:]}"

        # Regex: Units before Month (e.g. '331 Jun-26', '276 = Apr-26', '8331 Jun-26')
        matches = re.findall(r'\b(\d{2,5})[\s:=|\-_]*([A-Za-z]{3})[-\s,]*(\d{2,4})\b', text)
        
        # Regex: Month before Units (e.g. 'Jun-26 331')
        matches += [(m[2], m[0], m[1]) for m in re.findall(r'\b([A-Za-z]{3})[-\s,]*(\d{2,4})[\s:=|]+(\d{2,5})\b', text)]

        for u_str, m_name, y_str in matches:
            u_val = int(u_str)

            # Strip leading OCR noise digit if u_val > 5000 e.g. 8331 -> 331
            if u_val > 5000 and len(u_str) >= 4:
                u_val = int(u_str[1:])

            # Reject false year bleed-through matches e.g. '26 Feb-26' where unit == year and units < 50
            if u_val < 50 and u_str == y_str:
                continue

            if 10 <= u_val <= 5000:
                m_low = m_name.lower()[:3]
                if m_low in self.MONTHS_ARR:
                    y_full = f"20{y_str}" if len(y_str) == 2 else y_str
                    y_int = int(y_full)
                    curr_y = datetime.now().year
                    if not (curr_y - 3 <= y_int <= curr_y + 1):
                        continue
                    
                    y_short = y_full[-2:]
                    
                    # Exclude current bill month (e.g. Jul-26)
                    key_short = f"{m_low}-{y_short}"
                    if curr_bill_month and key_short == curr_bill_month:
                        continue

                    d_display = f"{m_name.capitalize()}-{y_full}"
                    key = f"{m_low}-{y_full}"
                    if key not in text_unit_map:
                        text_unit_map[key] = (d_display, u_val)

        payment_history = []
        for k, (d_display, u_val) in text_unit_map.items():
            payment_history.append(PaymentHistoryItem(
                date=d_display,
                units=f"{u_val} KWh",
                amount="—"
            ))

        def sort_hist_key(x: PaymentHistoryItem):
            try:
                return datetime.strptime(x.date, "%b-%Y")
            except ValueError:
                return datetime.min

        # Sort reverse chronological: most recent past month first (e.g. Jun-2026, May-2026, Apr-2026)
        payment_history.sort(key=sort_hist_key, reverse=True)
        return payment_history
