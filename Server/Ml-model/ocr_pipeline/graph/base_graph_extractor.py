from abc import ABC, abstractmethod
from typing import List
from ocr_pipeline.models.bill_schema import PaymentHistoryItem

class BaseGraphExtractor(ABC):
    """
    Abstract Base Class for provider-specific graph and bill history extractors.
    """

    MARATHI_MONTHS_DICT = {
        'जानेवारी': 'Jan', 'जाने': 'Jan',
        'फेब्रुवारी': 'Feb', 'फेब्रु': 'Feb',
        'मार्च': 'Mar',
        'एप्रिल': 'Apr',
        'मे': 'May',
        'जून': 'Jun', 'जुन': 'Jun',
        'जुलै': 'Jul',
        'ऑगस्ट': 'Aug',
        'सप्टेंबर': 'Sep', 'सप्टें': 'Sep',
        'ऑक्टोबर': 'Oct', 'ऑक्टो': 'Oct',
        'नोव्हेंबर': 'Nov', 'नोव्हें': 'Nov',
        'डिसेंबर': 'Dec', 'डिसें': 'Dec'
    }

    MONTHS_ARR = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

    @property
    @abstractmethod
    def provider_key(self) -> str:
        """Unique key identifying the provider (e.g., 'best', 'msedcl', 'tata', 'adani', 'torrent')"""
        pass

    @abstractmethod
    def extract_history(self, text: str, page_image=None, bill_date_str: str = "") -> List[PaymentHistoryItem]:
        """Extract billing & payment history items from document text/image."""
        pass

    def _add_to_unit_map(self, text_unit_map: dict, m_name: str, y_str: str, u_str: str):
        eng_month = None
        for mar_k, eng_v in self.MARATHI_MONTHS_DICT.items():
            if mar_k.lower() in m_name.lower():
                eng_month = eng_v
                break
        if not eng_month:
            for eng_v in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]:
                if eng_v.lower() in m_name.lower():
                    eng_month = eng_v
                    break
        if eng_month:
            try:
                u_val = int(u_str)
                if 10 <= u_val <= 5000:
                    y_val = int(y_str)
                    if y_val < 100:
                        y_val += 2000
                    k = f"{eng_month.lower()}-{y_val}"
                    text_unit_map[k] = (f"{eng_month}-{y_val}", u_val)
            except ValueError:
                pass
