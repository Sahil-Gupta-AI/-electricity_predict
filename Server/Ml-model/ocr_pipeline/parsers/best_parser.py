import re
from ocr_pipeline.core.base_parser import BaseProviderParser
from ocr_pipeline.core.registry import ParserRegistry
from ocr_pipeline.models.bill_schema import (
    ExtractedBill, CompanyInfo, ConsumerInfo, BillUsage, BillSummary
)
from ocr_pipeline.layout.anchor_finder import SpatialAnchorEngine
from ocr_pipeline.layout.tax_slab_parser import TaxAndSlabParser
from ocr_pipeline.graph.bar_chart_extractor import GraphExtractor

@ParserRegistry.register
class BestParser(BaseProviderParser):

    @property
    def provider_key(self) -> str:
        return "best"

    def matches(self, raw_text: str) -> bool:
        text_lower = raw_text.lower()
        if "torrent" in text_lower or "टॉरेंट" in text_lower or "mahavitaran" in text_lower or "msedcl" in text_lower or "mahadiscom" in text_lower:
            return False
        return "best undertaking" in text_lower or "brihanmumbai electric" in text_lower or "बृहन्मुंबई" in text_lower or "बेस्ट" in text_lower or "bestundertaking" in text_lower or bool(re.search(r'\bbest\b', text_lower))


    def parse(self, text: str, pages_images: list = None) -> ExtractedBill:
        anchor = SpatialAnchorEngine(text)
        slab_parser = TaxAndSlabParser()
        graph_extractor = GraphExtractor()

        company = CompanyInfo(
            name="BEST",
            cin=anchor.find_first_match([r'CIN\s*[:\-]?\s*([A-Z0-9]+)']),
            website=anchor.find_first_match([r'((?:www\.)?bestundertaking\.[a-z]{2,3})'], default="www.bestundertaking.com"),
            toll="1901",
            office="BEST Bhavan, Colaba, Mumbai - 400 001",
            gstin=anchor.find_first_match([r'GSTIN\s*[:\-]?\s*([A-Z0-9]{15})'])
        )

        # Consumer Name extraction logic for BEST bills
        c_name = "—"
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for idx, line in enumerate(lines):
            line_low = line.lower()
            if line_low.startswith("name:") or line_low.startswith("name :") or "name of consumer" in line_low:
                # 1. Check if name is on the same line
                val = re.sub(r'^(?:name\s*of\s*consumer|name)\s*[:\-]\s*', '', line, flags=re.IGNORECASE).strip()
                val = re.sub(r'^\s*Bill\s*For\s*[:\-]?\s*[A-Za-z]{3}[-\s]*\d{2,4}\s*', '', val, flags=re.IGNORECASE).strip()
                val_clean = re.split(r'\b(?:Book|Folio|Consumer|Invoice|Cycle|C\.A\.No|Service|Installation|Tariff|Category|Mobile|Email|Date)\b', val, flags=re.IGNORECASE)[0].strip()
                val_clean = re.sub(r'[\d\s]+$', '', val_clean).strip()

                if len(val_clean) >= 3 and not any(k in val_clean.lower() for k in ["address", "phone", "cin", "gstin"]):
                    c_name = val_clean
                    break
                
                # 2. Check next line if name is formatted underneath
                if idx + 1 < len(lines):
                    cand = lines[idx + 1].strip()
                    cand_clean = re.sub(r'^\s*Bill\s*For\s*[:\-]?\s*[A-Za-z]{3}[-\s]*\d{2,4}\s*', '', cand, flags=re.IGNORECASE).strip()
                    cand_clean = re.split(r'\b(?:Book|Folio|Consumer|Invoice|Cycle|C\.A\.No|Service|Installation|Tariff|Category|Mobile|Email|Address)\b', cand_clean, flags=re.IGNORECASE)[0].strip()
                    cand_clean = re.sub(r'[\d\s]+$', '', cand_clean).strip()
                    if len(cand_clean) >= 3 and not any(k in cand_clean.lower() for k in ["mobile", "email", "billing", "floor", "installation"]):
                        c_name = cand_clean
                        break

        if c_name == "—":
            name_m = re.search(r'\bName\s*[:\-]\s*([A-Za-z\s\&\.\,]{3,60})', text, re.IGNORECASE)
            if name_m:
                cand = name_m.group(1).strip()
                cand_clean = re.sub(r'^\s*Bill\s*For\s*[:\-]?\s*', '', cand, flags=re.IGNORECASE).strip()
                cand_clean = re.split(r'\b(?:Book|Folio|Consumer|Invoice|Cycle|C\.A\.No|Service|Installation|Tariff|Category|Mobile|Email|Address)\b', cand_clean, flags=re.IGNORECASE)[0].strip()
                if cand_clean and not cand_clean.lower().startswith("bill for"):
                    c_name = cand_clean

        # Consumer ID, Bill Date, Due Date, Connection No.
        c_id = anchor.find_first_match([
            r'C\.A\.No\.?\s*[:\-]?\s*([0-9]{5,15})',
            r'Consumer\s*No\.?\s*[:\-]?\s*([0-9\-\*]{5,20})',
            r'auch\s*hich\s*[:\-]?\s*([0-9]{5,15})'
        ])

        bill_date = anchor.find_first_match([
            r'Date\s*of\s*Bill\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z0-9]{3,10}[\/\-\s]\d{2,4})',
            r'\b(\d{1,2}\/\d{1,2}\/\d{4})\b'
        ])

        due_date = "—"
        row_m = re.search(r'([0-9\-\*]{5,20})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+([0-9\.]+)', text)
        if row_m:
            due_date = row_m.group(3)
        if due_date == "—":
            due_date = anchor.find_first_match([
                r'Due\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z0-9]{3,10}[\/\-\s]\d{2,4})'
            ])

        consumer = ConsumerInfo(
            name=c_name,
            id=c_id,
            connection=anchor.find_first_match([r'Meter\s*No[\:\-\s]*([0-9A-Za-z\-]{5,15})', r'Meter\s*No\s*\-\s*([0-9A-Za-z\-]{5,15})']),
            billDate=bill_date,
            dueDate=due_date,
            city="Mumbai",
            tariffCategory="Residential"
        )

        # Usage Units Extraction
        curr_units = "—"
        prev_units = "—"
        
        # Check units table e.g. "Units Consumed KWH Jul-26 341"
        u_match = re.search(r'Units\s*Consumed[^\n]*\n+([A-Za-z]{3}[-\s]*\d{2})\s+(\d{2,4})', text, re.IGNORECASE)
        if u_match:
            curr_units = f"{u_match.group(2)} KWh"

        amount_keywords = ["bill", "amount", "rs", "rupees", "रक्कम", "देयक", "मागील", "एकूण", "भरणा", "rupee", "payment", "net", "total", "printed", "date", "phone", "mobile", "cin", "gstin", "www", "http", "gmail", "invoice", "receipt"]

        for line in lines:
            line_low = line.lower()
            if any(w in line_low for w in amount_keywords) or re.search(r'\b\d{2}/\d{2}/\d{4}\b', line) or re.search(r'\b\d{2}:\d{2}:\d{2}\b', line):
                continue
            tokens = line.split()
            integers = []
            for t in tokens:
                if re.match(r'^\d{4,6}$', t):
                    val = int(t)
                    if val not in range(2020, 2031):
                        integers.append(val)
            if len(integers) >= 2:
                for i in range(len(integers) - 1):
                    v1, v2 = integers[i], integers[i+1]
                    if v2 > v1 and 10 <= (v2 - v1) <= 5000:
                        if curr_units == "—":
                            curr_units = f"{v2 - v1} KWh"
                        prev_units = f"{v1} (Reading)"
                        break

        # Fallback prior month units lookup from graph/table
        bill_month_m = re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\s]*(?:20)?(\d{2})\b', text, re.IGNORECASE)
        months_arr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        if bill_month_m:
            b_m_str = bill_month_m.group(1).lower()[:3]
            if b_m_str in months_arr:
                if curr_units == "—":
                    c_match = re.search(r'\b' + b_m_str + r'[-\s]*\d{2,4}[\s:=|]+(\d{2,4})\b', text, re.IGNORECASE)
                    if not c_match:
                        c_match = re.search(r'(\d{2,4})\s+' + b_m_str + r'[-\s]*\d{2,4}\b', text, re.IGNORECASE)
                    if c_match:
                        curr_units = f"{int(c_match.group(1))} KWh"
                
                prev_m_str = months_arr[(months_arr.index(b_m_str) - 1) % 12]
                p_match = re.search(r'(\d{2,4})\s+' + prev_m_str + r'[-\s]*\d{2,4}\b', text, re.IGNORECASE)
                if not p_match:
                    p_match = re.search(r'\b' + prev_m_str + r'[-\s]*\d{2,4}[\s:=|]+(\d{2,4})\b', text, re.IGNORECASE)
                if p_match:
                    prev_units = f"{int(p_match.group(1))} KWh"

        curr_amount = anchor.find_amount([
            r'Current\s*Months?\s*Bill\s*Amount[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b',
            r'Total\s*Current\s*Month\s*charges[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b',
            r'Total\s*Bill\s*Amount[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b',
            r'WRU\s*Ba\s*LH[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b'
        ])
        
        prev_amount = anchor.find_amount([
            r'Previous\s*Month\s*Bill\s*amount[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b',
            r'Previous\s*(?:Month\s*)?Bill\s*amount[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b',
            r'Payment\s*Received[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b'
        ])

        usage = BillUsage(
            currUnits=curr_units,
            prevUnits=prev_units,
            currAmount=curr_amount,
            prevAmount=prev_amount,
            status="Unpaid"
        )

        summary = BillSummary(
            energy=anchor.find_amount([r'Energy\s*Charges?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            fixed=anchor.find_amount([
                r'Fixed\s*Charges\s*\/\s*Demand\s*Charges[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b',
                r'Fixed\s*Charges[^\n\d\.\d]*([0-9,]+(?:\.[0-9]+)?)\b'
            ], default="₹135"),
            fac=anchor.find_amount([r'Fuel\s*Adjustment\s*(?:Charges)?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            wheeling=anchor.find_amount([r'Wheeling\s*Charges?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            duty=anchor.find_amount([r'Electricity\s*Duty[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            other=anchor.find_amount([
                r'M\.Tax\s*Sale\s*on\s*Electricity[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b',
                r'Municipal\s*Tax[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b'
            ], default="—"),
            total=curr_amount
        )

        slabs = slab_parser.extract_slabs(text, "best")
        history = graph_extractor.extract_history(text, company_key="best")

        return ExtractedBill(
            company=company,
            consumer=consumer,
            usage=usage,
            summary=summary,
            slabs=slabs,
            history=history,
            rawText=text
        )
