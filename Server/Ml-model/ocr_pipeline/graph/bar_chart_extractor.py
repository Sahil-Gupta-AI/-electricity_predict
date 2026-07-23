from typing import List
from ocr_pipeline.models.bill_schema import PaymentHistoryItem
from ocr_pipeline.graph.graph_registry import GraphRegistry

# Import all company-specific graph extractors to trigger registration
import ocr_pipeline.graph.best_graph_extractor
import ocr_pipeline.graph.msedcl_graph_extractor
import ocr_pipeline.graph.tata_graph_extractor
import ocr_pipeline.graph.adani_graph_extractor
import ocr_pipeline.graph.torrent_graph_extractor

class GraphExtractor:
    """
    Facade Graph Extractor delegating to provider-specific Graph Extractors.
    """

    def extract_history(self, text: str, page_image=None, company_key: str = "msedcl", bill_date_str: str = "") -> List[PaymentHistoryItem]:
        extractor = GraphRegistry.get(company_key)
        return extractor.extract_history(text, page_image=page_image, bill_date_str=bill_date_str)
