from typing import Dict, Type, Optional
from ocr_pipeline.core.base_parser import BaseProviderParser

class ParserRegistry:
    """
    Registry for provider parsers. Allows dynamic plugin loading
    without modifying monolithic conditional loops.
    """
    _parsers: Dict[str, BaseProviderParser] = {}

    @classmethod
    def register(cls, parser_cls: Type[BaseProviderParser]):
        instance = parser_cls()
        cls._parsers[instance.provider_key] = instance
        return parser_cls

    @classmethod
    def get_parser(cls, raw_text: str) -> BaseProviderParser:
        for key, parser in cls._parsers.items():
            if key != "generic" and parser.matches(raw_text):
                return parser
        return cls._parsers.get("generic")
