from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any

@dataclass
class CompanyInfo:
    name: str = "—"
    cin: str = "—"
    gstin: str = "—"
    website: str = "—"
    toll: str = "—"
    office: str = "—"

@dataclass
class ConsumerInfo:
    name: str = "—"
    id: str = "—"
    connection: str = "—"
    billDate: str = "—"
    dueDate: str = "—"
    city: str = "Mumbai"
    tariffCategory: str = "Residential"

@dataclass
class BillUsage:
    prevUnits: str = "—"
    prevAmount: str = "—"
    currUnits: str = "—"
    currAmount: str = "—"
    status: str = "Unpaid"

@dataclass
class BillSummary:
    energy: str = "—"
    fixed: str = "—"
    fac: str = "—"
    wheeling: str = "—"
    duty: str = "—"
    other: str = "—"
    total: str = "—"

@dataclass
class SlabInfo:
    range: str
    rate: str
    desc: str

@dataclass
class PaymentHistoryItem:
    date: str
    units: Optional[str] = "—"
    amount: str = "—"

@dataclass
class ExtractedBill:
    company: CompanyInfo = field(default_factory=CompanyInfo)
    consumer: ConsumerInfo = field(default_factory=ConsumerInfo)
    usage: BillUsage = field(default_factory=BillUsage)
    summary: BillSummary = field(default_factory=BillSummary)
    slabs: List[SlabInfo] = field(default_factory=list)
    history: List[PaymentHistoryItem] = field(default_factory=list)
    rawText: Optional[str] = ""

    def to_legacy_dict(self) -> Dict[str, Any]:
        """Convert to legacy format expected by existing Flask routes & React frontend."""
        return {
            "company": asdict(self.company),
            "consumer": asdict(self.consumer),
            "usage": asdict(self.usage),
            "summary": asdict(self.summary),
            "slabs": [asdict(s) for s in self.slabs],
            "history": [asdict(h) for h in self.history],
            "rawText": self.rawText or ""
        }
