import logging
from typing import Dict, Type
from ocr_pipeline.graph.base_graph_extractor import BaseGraphExtractor

logger = logging.getLogger(__name__)

class GraphRegistry:
    """
    Registry pattern for graph/history extractors.
    """
    _extractors: Dict[str, Type[BaseGraphExtractor]] = {}

    @classmethod
    def register(cls, extractor_cls: Type[BaseGraphExtractor]):
        instance = extractor_cls()
        cls._extractors[instance.provider_key.lower()] = extractor_cls
        logger.info(f"Registered Graph Extractor for provider: '{instance.provider_key}'")
        return extractor_cls

    @classmethod
    def get(cls, provider_key: str) -> BaseGraphExtractor:
        extractor_cls = cls._extractors.get(provider_key.lower())
        if not extractor_cls:
            extractor_cls = cls._extractors.get("generic")
        if not extractor_cls:
            raise KeyError(f"No Graph Extractor registered for key '{provider_key}' and no fallback found.")
        return extractor_cls()
