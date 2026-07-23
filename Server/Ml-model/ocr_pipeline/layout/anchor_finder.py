import re
from typing import List, Optional

class SpatialAnchorEngine:
    """
    Helper for finding values near anchor label keywords
    using relative text pattern proximity.
    """

    def __init__(self, text: str):
        self.text = text
        self.lines = [line.strip() for line in text.split('\n') if line.strip()]

    def find_first_match(self, patterns: List[str], default: str = "—") -> str:
        for pat in patterns:
            m = re.search(pat, self.text, re.IGNORECASE)
            if m:
                val = m.group(1) if m.groups() else m.group(0)
                return val.strip()
        return default

    def find_amount(self, patterns: List[str], default: str = "—") -> str:
        for pat in patterns:
            for m in re.finditer(pat, self.text, re.IGNORECASE):
                val = m.group(1) if m.groups() else m.group(0)
                val_clean = re.sub(r'^[^\d]+', '', val)
                raw = val_clean.replace(",", "").strip()
                try:
                    val_float = float(raw)
                    if abs(val_float - 1912.0) < 0.1:
                        continue
                    if val_float < 50.0:
                        continue
                    return f"₹{round(val_float):,}"
                except ValueError:
                    if raw and raw != "—":
                        return f"₹{raw}"
        return default

    def find_units(self, patterns: List[str], default: str = "—") -> str:
        for pat in patterns:
            for m in re.finditer(pat, self.text, re.IGNORECASE):
                val = m.group(1) if m.groups() else m.group(0)
                match_start = m.start()
                context = self.text[max(0, match_start - 35):match_start].lower()
                if any(x in context for x in ["billing unit", "बिलींग युनिट", "billing_unit", "b.u"]):
                    continue
                try:
                    val_float = float(val)
                    if val_float <= 5.0 or val_float > 10000.0:
                        continue
                    return f"{round(val_float)} KWh"
                except ValueError:
                    return f"{val.strip()} KWh"
        return default
