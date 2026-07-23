import os
import re
import pytesseract
from typing import List
from datetime import datetime, timedelta
from ocr_pipeline.graph.base_graph_extractor import BaseGraphExtractor
from ocr_pipeline.graph.graph_registry import GraphRegistry
from ocr_pipeline.models.bill_schema import PaymentHistoryItem

tesseract_cmd_paths = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
]
for t_path in tesseract_cmd_paths:
    if os.path.exists(t_path):
        pytesseract.pytesseract.tesseract_cmd = t_path
        break

tessdata_local = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tessdata"))
if os.path.exists(tessdata_local):
    os.environ["TESSDATA_PREFIX"] = tessdata_local

@GraphRegistry.register
class TorrentGraphExtractor(BaseGraphExtractor):
    """
    Dedicated Graph Extractor for Torrent Power Electricity Bills.
    Supports English & Marathi bar chart formats e.g. 'मागील वीज वापर' (Past Electricity Consumption).
    """

    @property
    def provider_key(self) -> str:
        return "torrent"

    def _get_previous_months(self, bill_date_str: str, num_months: int = 12):
        formats = ["%d-%b-%y", "%d-%b-%Y", "%d-%m-%Y", "%d-%m-%y", "%b-%Y", "%m-%Y"]
        clean_str = bill_date_str.replace("/", "-").replace(" ", "-").strip() if bill_date_str else ""
        clean_str = re.sub(r'^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$', '', clean_str)

        bill_date = None
        for fmt in formats:
            try:
                bill_date = datetime.strptime(clean_str, fmt)
                break
            except ValueError:
                continue
        if not bill_date:
            bill_date = datetime.now()

        months = []
        curr_date = bill_date
        for i in range(num_months):
            first = curr_date.replace(day=1)
            prev_month = first - timedelta(days=1)
            months.append(prev_month.strftime("%b-%Y"))
            curr_date = prev_month
        return months

    def extract_history(self, text: str, page_image=None, bill_date_str: str = "") -> List[PaymentHistoryItem]:
        text_unit_map = {}

        # 1. If page_image is provided, attempt hybrid graph cropping
        if page_image is not None:
            try:
                w, h = page_image.size
                is_6_month = "bhiwandi" in text.lower() or "shahapur" in text.lower() or "6 months" in text.lower()
                
                if is_6_month:
                    graph_box = (int(w * 0.03), int(h * 0.50), int(w * 0.97), int(h * 0.78))
                    layout_type = 6
                else:
                    graph_box = (int(w * 0.03), int(h * 0.50), int(w * 0.65), int(h * 0.78))
                    layout_type = 12

                graph_crop = page_image.crop(graph_box)
                crop_w, crop_h = graph_crop.size

                df = pytesseract.image_to_data(graph_crop, lang="eng", config="--psm 11", output_type=pytesseract.Output.DATAFRAME)
                df = df[df['text'].notna()]
                df['text'] = df['text'].astype(str).str.strip()
                df = df[(df['text'] != "") & (df['conf'] >= 40)]

                digits = []
                for idx, row in df.iterrows():
                    t = row['text']
                    if t.isdigit():
                        val = int(t)
                        if row['left'] < 0.10 * crop_w:
                            continue
                        if val in [2024, 2025, 2026, 2027] or val > 5000:
                            continue
                        digits.append({
                            "val": val,
                            "left": row['left'],
                            "top": row['top']
                        })

                if digits:
                    cols = []
                    for d in digits:
                        matched = False
                        for c in cols:
                            if abs(c['left'] - d['left']) < 35:
                                if d['top'] < c['top']:
                                    c['val'] = d['val']
                                    c['top'] = d['top']
                                matched = True
                                break
                        if not matched:
                            cols.append(d.copy())

                    cols = sorted(cols, key=lambda x: x['left'])
                    months_list = self._get_previous_months(bill_date_str, layout_type)

                    if len(cols) >= 2:
                        x_start = cols[0]['left']
                        x_end = cols[-1]['left']
                        spacing = (x_end - x_start) / max(1, len(cols) - 1)

                        for c in cols:
                            idx = int(round((c['left'] - x_start) / spacing)) if spacing > 0 else 0
                            if 0 <= idx < len(months_list):
                                m_display = months_list[idx]
                                key = m_display.lower()
                                text_unit_map[key] = (m_display, c['val'])
            except Exception as e:
                print("Hybrid graph extraction failed in TorrentGraphExtractor:", e)

        # 2. Check Marathi bar chart title e.g. "मागील वीज वापर"
        if not text_unit_map:
            m_chart = re.search(r'मागील\s*वीज\s*वापर[^\n]*\n+([\d\s\-\—\|]{10,150})', text, re.IGNORECASE)
            if m_chart:
                numbers = [int(x) for x in re.findall(r'\b\d{1,4}\b', m_chart.group(1)) if 5 <= int(x) <= 5000]
                if len(numbers) >= 2:
                    months_list = self._get_previous_months(bill_date_str, len(numbers))
                    for i, u in enumerate(numbers):
                        if i < len(months_list):
                            m_display = months_list[i]
                            key = m_display.lower()
                            text_unit_map[key] = (m_display, u)

        # 3. English bar chart patterns e.g. Jun-26 331 or 331 Jun-26 (Strict bar chart section)
        if not text_unit_map:
            chart_sec_m = re.search(r'(?:Past|Previous)\s*(?:Consumption|Usage)[^\n]*\n+([\s\S]{10,500})', text, re.IGNORECASE)
            chart_sec = chart_sec_m.group(1) if chart_sec_m else text
            unit_matches = re.findall(r'\b(\d{2,5})[\s:=|\-_]*([A-Za-z]{3})[-\s,]*(\d{2,4})\b', chart_sec)
            unit_matches += [(m[2], m[0], m[1]) for m in re.findall(r'\b([A-Za-z]{3})[-\s,]*(\d{2,4})[\s:=|]+(\d{2,5})\b', chart_sec)]
            for u_str, m_name, y_str in unit_matches:
                self._add_to_unit_map(text_unit_map, m_name, y_str, u_str)

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

        payment_history.sort(key=sort_hist_key, reverse=True)
        return payment_history
