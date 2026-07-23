import re
from typing import List, Dict, Any, Tuple
from ocr_pipeline.models.bill_schema import SlabInfo

class TaxAndSlabParser:
    """
    Dedicated parser for multi-tier consumption slabs, energy rates,
    FAC rates, wheeling charges, and duty percentages.
    """

    DEFAULT_TARIFFS = {
        "tata": [
            (100, 90, 4.43, 0.0, 2.76, 16.0),
            (300, 135, 9.64, 0.0, 2.76, 16.0),
            (500, 135, 12.83, 0.0, 2.76, 16.0),
            (float('inf'), 160, 14.33, 0.0, 2.76, 16.0)
        ],
        "msedcl": [
            (100, 130, 3.96, 0.15, 1.60, 16.0),
            (300, 130, 10.80, 0.25, 1.60, 16.0),
            (500, 130, 15.03, 0.35, 1.60, 16.0),
            (float('inf'), 130, 17.53, 0.40, 1.60, 16.0)
        ],
        "adani": [
            (100, 90, 2.65, 0.65, 2.28, 16.0),
            (300, 135, 5.85, 0.65, 2.28, 16.0),
            (500, 135, 7.10, 0.65, 2.28, 16.0),
            (float('inf'), 160, 8.35, 0.65, 2.28, 16.0)
        ],
        "torrent": [
            (100, 130, 4.28, 0.10, 1.47, 16.0),
            (300, 130, 11.10, 0.15, 1.47, 16.0),
            (500, 130, 15.38, 0.20, 1.47, 16.0),
            (float('inf'), 130, 17.68, 0.20, 1.47, 16.0)
        ],
        "best": [
            (100, 90, 2.10, 0.75, 1.87, 16.0),
            (300, 135, 5.50, 0.75, 1.87, 16.0),
            (500, 135, 10.18, 0.75, 1.87, 16.0),
            (float('inf'), 160, 11.55, 0.75, 1.87, 16.0)
        ]
    }

    def get_default_slabs(self, company_key: str) -> List[SlabInfo]:
        clean_slab_names = ["First 100 units", "Next 200 units", "Next 200 units", "Next 500 units", "Above 1000 units"]
        company_slabs = self.DEFAULT_TARIFFS.get(company_key, self.DEFAULT_TARIFFS["tata"])
        default_slabs = []
        prev_limit = 0
        for i, (limit, _, energy_rate, fac_rate, wheeling_rate, _) in enumerate(company_slabs):
            total_rate = energy_rate
            if limit == float('inf'):
                s_range = f"{prev_limit + 1}+"
            else:
                s_range = f"{prev_limit + 1} – {limit}" if prev_limit > 0 else f"0 – {limit}"
            
            desc = clean_slab_names[i] if i < len(clean_slab_names) else "Above 500 units"
            default_slabs.append(SlabInfo(
                range=s_range,
                rate=f"₹{total_rate:.2f}",
                desc=desc
            ))
            prev_limit = limit
        return default_slabs

    def extract_slabs(self, text: str, company_key: str) -> List[SlabInfo]:
        default_slabs = self.get_default_slabs(company_key)

        lines_list = text.split('\n')
        base_rates_candidate = None
        fac_rates_candidate = None
        
        for line in lines_list:
            line = line.strip()
            if not line:
                continue
            
            clean_line = re.sub(r'[₹रु\s\|]', ' ', line)
            tokens = clean_line.split()
            numbers = []
            for t in tokens:
                t_clean = re.sub(r'^[^\d]+|[^\d]+$', '', t)
                if re.match(r'^\d+(?:\.\d+)?$', t_clean):
                    try:
                        val = float(t_clean)
                        if val < 100.0:
                            numbers.append(val)
                    except ValueError:
                        pass
                        
            if len(numbers) >= 4:
                for start_idx in range(len(numbers) - 3):
                    subset_5 = numbers[start_idx:start_idx + 5]
                    subset_4 = numbers[start_idx:start_idx + 4]
                    
                    if len(subset_5) == 5:
                        if (1.5 <= subset_5[0] <= 6.5 and 
                            4.0 <= subset_5[1] <= 14.0 and 
                            6.0 <= subset_5[2] <= 19.0 and 
                            8.0 <= subset_5[3] <= 22.0 and
                            8.0 <= subset_5[4] <= 22.0):
                            base_rates_candidate = subset_5
                            break
                            
                    if (1.5 <= subset_4[0] <= 6.5 and 
                        4.0 <= subset_4[1] <= 14.0 and 
                        6.0 <= subset_4[2] <= 19.0 and 
                        8.0 <= subset_4[3] <= 22.0):
                        base_rates_candidate = subset_4
                        break

        if base_rates_candidate:
            num_slabs = len(base_rates_candidate)
            if num_slabs == 5:
                ranges = ["0 – 100", "101 – 300", "301 – 500", "501 – 1000", "1001+"]
                descriptions = ["First 100 units", "Next 200 units", "Next 200 units", "Next 500 units", "Above 1000 units"]
            else:
                ranges = ["0 – 100", "101 – 300", "301 – 500", "501+"]
                descriptions = ["First 100 units", "Next 200 units", "Next 200 units", "Above 500 units"]
                
            slabs = []
            for i in range(num_slabs):
                base = base_rates_candidate[i]
                slabs.append(SlabInfo(
                    range=ranges[i],
                    rate=f"₹{base:.2f}",
                    desc=descriptions[i]
                ))
            return slabs
            
        return default_slabs
