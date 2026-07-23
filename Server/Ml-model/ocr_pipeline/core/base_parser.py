from abc import ABC, abstractmethod
from typing import Dict, Any
from ocr_pipeline.models.bill_schema import ExtractedBill

class BaseProviderParser(ABC):
    """
    Abstract Base Class that every electricity provider parser must implement.
    Guarantees isolation between utility companies.
    """

    @property
    @abstractmethod
    def provider_key(self) -> str:
        """Return provider identification key (e.g. 'best', 'tata', 'msedcl', 'adani', 'torrent')"""
        pass

    @abstractmethod
    def matches(self, raw_text: str) -> bool:
        """Returns True if this parser should handle the given bill document text."""
        pass

    @abstractmethod
    def parse(self, text: str, pages_images: list = None) -> ExtractedBill:
        """Parses document text & pages into a validated ExtractedBill instance."""
        pass
