import re
from typing import List
from datetime import datetime
from ocr_pipeline.graph.base_graph_extractor import BaseGraphExtractor
from ocr_pipeline.graph.graph_registry import GraphRegistry
from ocr_pipeline.models.bill_schema import PaymentHistoryItem

@GraphRegistry.register
class TataGraphExtractor(BaseGraphExtractor):
    """
    Dedicated Graph Extractor for Tata Power Electricity Bills.
    """

    @property
    def provider_key(self) -> str:
        return "tata"

    def extract_history(self, text: str, page_image=None, bill_date_str: str = "") -> List[PaymentHistoryItem]:
        text_unit_map = {}

        unit_matches = re.findall(r'([A-Za-z]{3,10})[-\s,]*(\d{2,4})[\s:=|]+(\d{2,4})\b', text)
        for m in unit_matches:
            m_name, y_str, u_str = m[0].strip(), m[1].strip(), m[2].strip()
            self._add_to_unit_map(text_unit_map, m_name, y_str, u_str)

        text_pay_map = {}
        history_idx = -1
        keywords = ["payment history", "billing history", "last 6 months"]
        text_lower = text.lower()
        for kw in keywords:
            idx = text_lower.find(kw)
            if idx != -1:
                history_idx = idx
                break
                
        if history_idx != -1:
            history_text = text[history_idx:]
            p_matches = re.findall(r'(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})\s+([0-9\.,]+)', history_text)
            for d_day, m_num, y_str, a_str in p_matches:
                try:
                    m_int = int(m_num)
                    y_int = int(y_str)
                    if y_int < 100: y_int += 2000
                    bill_m_int = m_int - 1
                    bill_y_int = y_int
                    if bill_m_int == 0:
                        bill_m_int = 12
                        bill_y_int -= 1
                    if 1 <= bill_m_int <= 12:
                        m_str = self.MONTHS_ARR[bill_m_int - 1]
                        key = f"{m_str}-{bill_y_int}"
                        a_val = float(a_str.replace(',', ''))
                        if 100 <= a_val <= 300000:
                            text_pay_map[key] = (f"{m_str.capitalize()}-{bill_y_int}", round(a_val))
                except ValueError:
                    pass

        payment_history = []
        all_keys = set(text_unit_map.keys()).union(set(text_pay_map.keys()))
        for k in all_keys:
            d_display = text_unit_map[k][0] if k in text_unit_map else text_pay_map[k][0]
            units_val = text_unit_map[k][1] if k in text_unit_map else None
            amount_val = text_pay_map[k][1] if k in text_pay_map else None

            payment_history.append(PaymentHistoryItem(
                date=d_display,
                units=f"{units_val} KWh" if units_val else "—",
                amount=f"₹{amount_val:,}" if amount_val else "—"
            ))

        def sort_hist_key(x: PaymentHistoryItem):
            try:
                return datetime.strptime(x.date, "%b-%Y")
            except ValueError:
                return datetime.min

        payment_history.sort(key=sort_hist_key, reverse=True)
        return payment_history
