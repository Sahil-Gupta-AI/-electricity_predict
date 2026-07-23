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
class GenericParser(BaseProviderParser):

    @property
    def provider_key(self) -> str:
        return "generic"

    def matches(self, raw_text: str) -> bool:
        return True

    def parse(self, text: str, pages_images: list = None) -> ExtractedBill:
        anchor = SpatialAnchorEngine(text)
        slab_parser = TaxAndSlabParser()
        graph_extractor = GraphExtractor()

        company = CompanyInfo(
            name=anchor.find_first_match([r'Company\s*[:\-]?\s*([^\n]+)'], default="Electricity Board"),
            cin=anchor.find_first_match([r'CIN\s*[:\-]?\s*([A-Z0-9]+)']),
            website=anchor.find_first_match([r'www\.[a-zA-Z0-9\-\.]+\.[a-z]{2,}']),
            toll=anchor.find_first_match([r'Toll\s*Free\s*[:\-]?\s*([0-9\- ]+)']),
            office="—",
            gstin=anchor.find_first_match([r'GSTIN\s*[:\-]?\s*([A-Z0-9]{15})'])
        )

        consumer = ConsumerInfo(
            name=anchor.find_first_match([r'Consumer\s*Name\s*[:\-]?\s*([A-Za-z\s]{3,40})', r'Name\s*[:\-]\s*([A-Za-z\s]{3,40})']),
            id=anchor.find_first_match([r'Consumer\s*No\.?\s*[:\-]?\s*([0-9]{5,15})', r'Account\s*No\.?\s*[:\-]?\s*([0-9]{5,15})']),
            connection=anchor.find_first_match([r'Meter\s*No[\:\-\s]*([0-9A-Za-z\-]{5,15})']),
            billDate=anchor.find_first_match([r'Bill\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z0-9]{3,10}[\/\-\s]\d{2,4})', r'\b(\d{1,2}\/\d{1,2}\/\d{4})\b']),
            dueDate=anchor.find_first_match([r'Due\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z0-9]{3,10}[\/\-\s]\d{2,4})']),
            city="Mumbai",
            tariffCategory="Residential"
        )

        curr_units = anchor.find_units([r'Consumption\s+([0-9]+)', r'Units\s*Consumed\s*[:\-]?\s*([0-9]+)'])
        prev_units = anchor.find_units([r'Previous\s*Units\s*[:\-]?\s*([0-9]+)'])
        curr_amount = anchor.find_amount([r'Total\s*Bill\s*Amount[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b', r'Net\s*Payable[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b'])
        prev_amount = anchor.find_amount([r'Previous\s*Bill\s*amount[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b'])

        usage = BillUsage(
            currUnits=curr_units,
            prevUnits=prev_units,
            currAmount=curr_amount,
            prevAmount=prev_amount,
            status="Unpaid"
        )

        summary = BillSummary(
            energy=anchor.find_amount([r'Energy\s*Charges?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            fixed=anchor.find_amount([r'Fixed\s*Charges?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            fac=anchor.find_amount([r'Fuel\s*Adjustment[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            wheeling=anchor.find_amount([r'Wheeling\s*Charges?[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            duty=anchor.find_amount([r'Electricity\s*Duty[^\n\d]*([0-9,]+(?:\.[0-9]+)?)\b']),
            other="—",
            total=curr_amount
        )

        slabs = slab_parser.extract_slabs(text, "tata")
        history = graph_extractor.extract_history(text, company_key="tata")

        return ExtractedBill(
            company=company,
            consumer=consumer,
            usage=usage,
            summary=summary,
            slabs=slabs,
            history=history,
            rawText=text
        )
