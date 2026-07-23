from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class BoundingBox:
    x: float
    y: float
    w: float
    h: float

    @property
    def x2(self) -> float:
        return self.x + self.w

    @property
    def y2(self) -> float:
        return self.y + self.h

    @property
    def center_x(self) -> float:
        return self.x + self.w / 2.0

    @property
    def center_y(self) -> float:
        return self.y + self.h / 2.0

@dataclass
class OCRToken:
    text: str
    bbox: BoundingBox
    confidence: float = 1.0
    page_num: int = 1

@dataclass
class SpatialLine:
    tokens: List[OCRToken]
    text: str
    bbox: BoundingBox
