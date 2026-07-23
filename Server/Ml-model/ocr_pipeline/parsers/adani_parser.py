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
class AdaniParser(BaseProviderParser):

    @property
    def provider_key(self) -> str:
        return "adani"

    def matches(self, raw_text: str) -> bool:
        text_lower = raw_text.lower()
        return "adani" in text_lower or "अदानी" in text_lower

    def parse(self, text: str, pages_images: list = None) -> ExtractedBill:
        anchor = SpatialAnchorEngine(text)
        slab_parser = TaxAndSlabParser()
        graph_extractor = GraphExtractor()

        company = CompanyInfo(
            name="Adani Electricity",
            cin=anchor.find_first_match([r'CIN\s*[:\-]?\s*([A-Z0-9]+)'], default="U40120MH2008PLC179973"),
            website="www.adanielectricity.com",
            toll="19122",
            office="Adani Corporate House, Shantigram, Near Vaishno Devi Circle, SG Highway, Ahmedabad",
            gstin=anchor.find_first_match([r'GSTIN\s*[:\-]?\s*([A-Z0-9]{15})'])
        )

        c_name = "—"
        name_m = re.search(r'(?:Name\s*&\s*Address|Customer\s*Name|Name)\s*[:\-]?\s*(?:Account[^\n]*\n+)?([A-Za-z\s\.\,\&]{3,40})', text, re.IGNORECASE)
        if name_m:
            cand = name_m.group(1).strip()
            if not any(w in cand.lower() for w in ["house", "road", "mumbai", "customer", "consumer"]):
                c_name = cand
        if c_name == "—":
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            for idx, l in enumerate(lines):
                if any(k in l for k in ["1800-233-3435", "adanielectricity"]):
                    if idx + 1 < len(lines):
                        cand = lines[idx + 1]
                        if not any(w in cand.lower() for w in ["house", "gatin", "gstin", "cin", "bill"]):
                            c_name = cand
                            break

        c_id = anchor.find_first_match([
            r'(?:Account\s*No\.?|Consumer\s*No\.?|auch\s*hich)\s*[:\-]?\s*([0-9]{5,15})'
        ])

        bill_date = anchor.find_first_match([
            r'Date\s*of\s*Bill\s*[:\-]?\s*(\d{1,2}[\/\-\.\s][A-Za-z0-9]{3,10}[\/\-\.\s]\d{2,4})',
            r'Bill\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\.\s][A-Za-z0-9]{3,10}[\/\-\.\s]\d{2,4})'
        ])

        due_date = anchor.find_first_match([
            r'2g\s*feaic\s*[:\-]?\s*(\d{1,2}[\/\-\.\s][A-Za-z0-9]{3,10}[\/\-\.\s]\d{2,4})',
            r'Due\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\.\s][A-Za-z0-9]{3,10}[\/\-\.\s]\d{2,4})'
        ])

        curr_amount = anchor.find_amount([
            r'(?:WRU|UQU)\s*Ba\s*LH\s*[₹रु]?\s*([0-9,]+(?:\.[0-9]+)?)\b',
            r'Total\s*Amount\s*Payable\s*[:\-]?\s*(?:Rs\.?)?\s*([0-9,]+(?:\.[0-9]+)?)\b',
            r'Total\s*Bill\s*Amount[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b',
            r'Net\s*Payable[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b'
        ])

        curr_units = anchor.find_units([
            r'(\d+)\s*(?:kWh|KWh)\b',
            r'Units\s*Consumed\s*[:\-]?\s*([0-9]+)'
        ])
        prev_units = anchor.find_units([r'Previous\s*Units\s*[:\-]?\s*([0-9]+)'])
        prev_amount = anchor.find_amount([r'Previous\s*Bill\s*amount[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b'])

        consumer = ConsumerInfo(
            name=c_name,
            id=c_id,
            connection=anchor.find_first_match([r'Meter\s*No[\:\-\s]*([0-9A-Za-z\-]{5,15})']),
            billDate=bill_date,
            dueDate=due_date,
            city="Mumbai",
            tariffCategory="Residential"
        )

        usage = BillUsage(
            currUnits=curr_units,
            prevUnits=prev_units,
            currAmount=curr_amount,
            prevAmount=prev_amount,
            status="Unpaid"
        )

        summary = BillSummary(
            energy=anchor.find_amount([r'Energy\s*Charges?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            fixed=anchor.find_amount([r'Fixed\s*Charges?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b'], default="₹90"),
            fac=anchor.find_amount([r'Fuel\s*Adjustment[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            wheeling=anchor.find_amount([r'Wheeling\s*Charges?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            duty=anchor.find_amount([r'Electricity\s*Duty[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            other="—",
            total=curr_amount
        )

        slabs = slab_parser.extract_slabs(text, "adani")
        history = graph_extractor.extract_history(text, company_key="adani")

        return ExtractedBill(
            company=company,
            consumer=consumer,
            usage=usage,
            summary=summary,
            slabs=slabs,
            history=history,
            rawText=text
        )
