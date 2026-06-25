from flask import Flask, request, jsonify
import pandas as pd
import joblib
import pytesseract
from PIL import Image
import io
import re
import os

# Configure Tesseract path on Windows
tesseract_default_paths = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe".format(os.getlogin()),
]
for path in tesseract_default_paths:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        break

# Configure custom tessdata prefix to support Marathi
tessdata_local = os.path.abspath(os.path.join(os.path.dirname(__file__), "tessdata"))
if os.path.exists(tessdata_local):
    os.environ["TESSDATA_PREFIX"] = tessdata_local

app = Flask(__name__)

ensemble_model = joblib.load("ensemble_model.pkl")
columns = joblib.load("feature_columns.pkl")

print("Model loaded. Columns:", columns)

appliance_model = None
appliance_columns = None
if os.path.exists("appliance_model.pkl") and os.path.exists("appliance_columns.pkl"):
    appliance_model = joblib.load("appliance_model.pkl")
    appliance_columns = joblib.load("appliance_columns.pkl")
    print("Appliance model loaded. Columns count:", len(appliance_columns))

temp_map = {
    1: 24,
    2: 26,
    3: 30,
    4: 34,
    5: 36,
    6: 32,
    7: 29,
    8: 28,
    9: 28,
    10: 30,
    11: 27,
    12: 24
}


def get_season(month):
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Summer"
    elif month in [6, 7, 8, 9]:
        return "Monsoon"
    else:
        return "PostMonsoon"


def parse_tariff_value(val):
    if not val:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    # Remove currency symbol, percent sign, spaces, and everything after /
    val_clean = str(val).split('/')[0]
    val_clean = re.sub(r'[^\d\.]', '', val_clean)
    try:
        return float(val_clean)
    except ValueError:
        return 0.0


@app.route("/predict", methods=["POST"])
def predict():
    print("Flask /predict hit")

    data = request.json
    print("Received data:", ascii(data))

    month_raw = data.get("month")
    units = float(data.get("unit", 0))
    amount = float(data.get("amount", 0))

    if isinstance(month_raw, int):
        month = month_raw
    else:
        from datetime import datetime
        try:
            month = int(month_raw)
        except (ValueError, TypeError):
            month = datetime.strptime(str(month_raw), "%b %Y").month

    print(f"Parsed month: {month}")

    # Check prediction type
    prediction_type = data.get("prediction_type", "history")

    if prediction_type == "appliances":
        if appliance_model is None or appliance_columns is None:
            return jsonify({"error": "Appliance model or feature columns are not loaded."}), 500
        
        appliances_data = data.get("appliances", {})
        fan_hours = float(appliances_data.get("fan", 0)) * float(appliances_data.get("fan_qty", 1))
        fridge_hours = float(appliances_data.get("fridge", 0)) * float(appliances_data.get("fridge_qty", 1))
        ac_hours = float(appliances_data.get("ac", 0)) * float(appliances_data.get("ac_qty", 1))
        tv_hours = float(appliances_data.get("tv", 0)) * float(appliances_data.get("tv_qty", 1))
        monitor_hours = float(appliances_data.get("monitor", 0)) * float(appliances_data.get("monitor_qty", 1))
        motor_pump_hours = float(appliances_data.get("motorPump", 0)) * float(appliances_data.get("motorPump_qty", 1))
        
        # Calculate consumption for extra appliances not present in the ML dataset features
        geyser_hours = float(appliances_data.get("geyser", 0)) * float(appliances_data.get("geyser_qty", 1))
        bulb_hours = float(appliances_data.get("bulb", 0)) * float(appliances_data.get("bulb_qty", 1))
        wm_hours = float(appliances_data.get("wm", 0)) * float(appliances_data.get("wm_qty", 1))
        other_hours = float(appliances_data.get("other", 0)) * float(appliances_data.get("other_qty", 1))
        
        extra_units = 30.0 * (2.0 * geyser_hours + 0.012 * bulb_hours + 0.5 * wm_hours + 0.1 * other_hours)
        
        provider = data.get("provider", "none")
        
        # Mapping matching dataset unique cities and companies
        provider_to_city_company = {
            "tata": ("Mumbai", "Tata Power Company Ltd."),
            "adani": ("Mumbai", "Adani Power Ltd."),
            "torrent": ("Ahmedabad", "Torrent Power Ltd."),
            "msedcl": ("Pune", "Maha Transco \ufffd Maharashtra State Electricity Transmission Co, Ltd."),
            "best": ("Mumbai", "Tata Power Company Ltd."),
            "none": ("Mumbai", "Tata Power Company Ltd.")
        }
        
        city, company = provider_to_city_company.get(provider.lower(), ("Mumbai", "Tata Power Company Ltd."))
        if provider.lower() == "msedcl":
            company = "Maha Transco \ufffd Maharashtra State Electricity Transmission Co, Ltd."
            
        print(f"Appliance input details: month={month}, city={ascii(city)}, company={ascii(company)}")
        
        input_data = {
            "Fan": fan_hours,
            "Refrigerator": fridge_hours,
            "AirConditioner": ac_hours,
            "Television": tv_hours,
            "Monitor": monitor_hours,
            "MotorPump": motor_pump_hours,
            "Month": month,
            "City": city,
            "Company": company
        }
        
        df_input = pd.DataFrame([input_data])
        df_encoded = pd.get_dummies(df_input, columns=["City", "Company"])
        df_encoded = df_encoded.reindex(columns=appliance_columns, fill_value=0)
        
        print("Appliance Input DataFrame shape:", df_encoded.shape)
        
        predictUnit = round(float(appliance_model.predict(df_encoded)[0]) + extra_units, 2)
        
        # Calculate amount properly using tariff details if available
        fixed = parse_tariff_value(data.get("fixedCharge"))
        rate = parse_tariff_value(data.get("energyRate"))
        fac_rate = parse_tariff_value(data.get("fac"))
        duty_pct = parse_tariff_value(data.get("duty"))
        
        if rate > 0:
            energy_charges = predictUnit * rate
            fac_charges = predictUnit * fac_rate
            subtotal = fixed + energy_charges + fac_charges
            duty_charge = subtotal * (duty_pct / 100.0)
            predictAmount = round(subtotal + duty_charge, 2)
        else:
            if units > 0:
                predictAmount = round(amount * (predictUnit / units), 2)
            else:
                predictAmount = amount
            
        print(f"Appliance prediction: predictUnit={predictUnit}, predictAmount={predictAmount}")
        
        return jsonify({
            "predictUnit": predictUnit,
            "month": month_raw,
            "unit": units,
            "amount": amount,
            "predictAmount": predictAmount
        })

    else:
        # Existing historical prediction
        temp = temp_map[month]
        season = get_season(month)

        print(f"month={month}, units={units}, amount={amount}, temp={temp}, season={season}")

        input_data = {
            "Units_30d": units,
            "Month": month,
            "Temp": temp,
            "Amount": amount,
            "Season_PostMonsoon": 1 if season == "PostMonsoon" else 0,
            "Season_Summer": 1 if season == "Summer" else 0,
            "Season_Winter": 1 if season == "Winter" else 0
        }

        df = pd.DataFrame([input_data])
        df = df[columns]

        print("DataFrame:\n", df)

        predictUnit = round(float(ensemble_model.predict(df)[0]), 2)

        # Calculate amount properly using tariff details if available
        fixed = parse_tariff_value(data.get("fixedCharge"))
        rate = parse_tariff_value(data.get("energyRate"))
        fac_rate = parse_tariff_value(data.get("fac"))
        duty_pct = parse_tariff_value(data.get("duty"))

        if rate > 0:
            energy_charges = predictUnit * rate
            fac_charges = predictUnit * fac_rate
            subtotal = fixed + energy_charges + fac_charges
            duty_charge = subtotal * (duty_pct / 100.0)
            predictAmount = round(subtotal + duty_charge, 2)
        else:
            if units > 0:
                predictAmount = round(amount * (predictUnit / units), 2)
            else:
                predictAmount = amount

        print(f"History prediction: predictUnit={predictUnit}, predictAmount={predictAmount}")

        return jsonify({
            "predictUnit": predictUnit,
            "month": month_raw,
            "unit": units,
            "amount": amount,
            "predictAmount": predictAmount
        })


def translate_marathi_digits(text):
    marathi_to_english = {
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    }
    for mar_char, eng_char in marathi_to_english.items():
        text = text.replace(mar_char, eng_char)
    return text


def parse_bill_text(text):
    """Extract structured fields from OCR raw text of an electricity bill."""
    # Preprocess to strip out percentage qualifiers like (16 %)
    text = re.sub(r'\(\d+\s*%\)', '', text)
    
    def find(patterns, default="—"):
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = m.group(1) if m.groups() else m.group(0)
                return val.strip()
        return default

    def find_amount(patterns, default="—"):
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = m.group(1) if m.groups() else m.group(0)
                raw = val.replace(",", "").strip()
                try:
                    val_float = float(raw)
                    if val_float.is_integer():
                        return f"₹{int(val_float):,}"
                    else:
                        return f"₹{val_float:,.2f}"
                except ValueError:
                    return f"₹{raw}"
        return default

    def find_units(patterns, default="—"):
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = m.group(1) if m.groups() else m.group(0)
                return f"{val.strip()} KWh"
        return default

    def extract_slabs():
        # Default fallback slabs (the ones specified by the user)
        default_slabs = [
            {"range": "0 – 100",   "rate": "₹4.21", "desc": "First 100 units"},
            {"range": "101 – 300", "rate": "₹6.00", "desc": "Next 200 units"},
            {"range": "301 – 500", "rate": "₹7.50", "desc": "Next 200 units"},
            {"range": "501+",      "rate": "₹8.75", "desc": "Above 500 units"},
        ]
        
        # Try to find horizontal slab ranges in Torrent Power / MSEDCL format
        ranges_match = re.search(r'(0\s*[-–]\s*100)\s+(?:\|?\s*)?(101\s*[-–]\s*300)\s+(?:\|?\s*)?(301\s*[-–]\s*500)\s+(?:\|?\s*)?(501\s*[-–]\s*1000)?(?:[^\n]*?(>1000|\d{4}\+))?', text, re.IGNORECASE)
        
        if ranges_match:
            # Extract matched ranges
            raw_ranges = [g for g in ranges_match.groups() if g]
            # Look for the rates line near it (Amt(Rs) followed by numbers)
            rates_match = re.search(r'Amt\s*[\(\{\[\s]*[Rr]s\.?[\)\}\]\s]*\s*([0-9\.\s]+)', text, re.IGNORECASE)
            if not rates_match:
                # Fallback to general numbers on the next line or search near ranges
                rates_match = re.search(r'(?:Rate|Charge|Price)\s*[:\-]?\s*([0-9\.\s]+)', text, re.IGNORECASE)
                
            if rates_match:
                raw_rates = [r for r in rates_match.group(1).split() if re.match(r'^\d+(\.\d+)?$', r)]
                # If we got the rates, align them with the ranges!
                if len(raw_rates) >= len(raw_ranges):
                    slabs = []
                    for i, r_range in enumerate(raw_ranges):
                        rate = f"₹{raw_rates[i]}"
                        desc = "First 100 units"
                        if "300" in r_range:
                            desc = "Next 200 units"
                        elif "500" in r_range:
                            desc = "Next 200 units"
                        elif "1000" in r_range or "+" in r_range or ">" in r_range:
                            desc = "Above 500 units"
                        # Clean range formatting
                        cleaned_range = r_range.replace("-", " – ").replace("  ", " ").strip()
                        slabs.append({
                            "range": cleaned_range,
                            "rate": rate,
                            "desc": desc
                        })
                    return slabs
                    
        # Try to find vertical slab ranges (e.g. range followed by rate/amount)
        vertical_matches = re.findall(r'(\d+\s*[-–]\s*\d+|\d+\+)\s+(?:units\s+)?(?:Rs\.?|₹)?\s*(\d+(?:\.\d+)?)\b', text, re.IGNORECASE)
        if vertical_matches and len(vertical_matches) >= 3:
            slabs = []
            for r_range, r_rate in vertical_matches[:4]:
                desc = "First range units"
                if "100" in r_range:
                    desc = "First 100 units"
                elif "300" in r_range:
                    desc = "Next 200 units"
                elif "500" in r_range:
                    desc = "Next 200 units"
                elif "+" in r_range:
                    desc = "Above 500 units"
                cleaned_range = r_range.replace("-", " – ").replace("  ", " ").strip()
                slabs.append({
                    "range": cleaned_range,
                    "rate": f"₹{r_rate}",
                    "desc": desc
                })
            return slabs
            
        return default_slabs

    # Company
    company_name = find([
        r'(Torrent Power[^\n]*)',
        r'(Tata Power[^\n]*)',
        r'(Adani[^\n]*)',
        r'(MSEDCL[^\n]*)',
        r'(BSES[^\n]*)',
        r'(महावितरण[^\n]*)',
        r'(महाराष्ट्र राज्य विद्युत[^\n]*)',
        r'Company\s*[:\-]?\s*([^\n]+)',
    ])
    cin = find([r'CIN\s*[:\-]?\s*([A-Z0-9]+)', r'U\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}'])
    gstin = find([
        r'\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}',
        r'GSTIN\s*(?:of\s+\w+)?\s*[:\-]?\s*([A-Z0-9]{15})',
        r'GSTIN\s*[:\-]?\s*([A-Z0-9]{10,15})'
    ])
    website = find([
        r'(?:Website\s*[:\-]?\s*)?((?:www\.|connect\.)?torrentpower\.[a-z]{2,3}(?:\.[a-z]{2})?)',
        r'(?:Website\s*[:\-]?\s*)?((?:www\.)?mahadiscom\.[a-z]{2,3}(?:\.[a-z]{2})?)',
        r'(?:Website\s*[:\-]?\s*)?((?:www\.)?tatapower\.[a-z]{2,3}(?:\.[a-z]{2})?)',
        r'www\.[a-zA-Z0-9\-\.]+\.[a-z]{2,}',
        r'[a-zA-Z0-9\-\.]+\.[a-z]{2,}'
    ])
    toll = find([r'(\d{4,6})\s*\(?Toll[- ]Free\)?', r'Toll\s*Free\s*[:\-]?\s*([0-9\- ]+)'])

    # Registered office
    office_lines = re.findall(r'(?:Registered Office|NDPL House|Hudson Lines)[^\n]*', text, re.IGNORECASE)
    registered_office = " ".join(office_lines[:2]) if office_lines else "—"

    # Consumer Name
    def get_consumer_name_robust(text):
        # Look for the line after the 12-digit consumer ID
        m = re.search(r'\b\d{12}\b[^\n]*\n+([^\n]+)', text)
        if m:
            line = m.group(1).strip()
            # Clean up the line by removing amounts, labels, etc.
            line_cleaned = re.split(r'\b(?:Bill|Amount|Rs|daw|UHHH|deyak|deya|Rs|रु|देयक|रक्कम|\:|\d+\.\d+|Amount)\b', line, flags=re.IGNORECASE)[0].strip()
            # Remove any trailing non-alphabetic chars
            line_cleaned = re.sub(r'[^A-Za-z\s]', '', line_cleaned).strip()
            if len(line_cleaned) >= 3:
                # Check if subsequent lines are part of the name
                idx = text.find(line)
                if idx != -1:
                    remaining_text = text[idx + len(line):]
                    lines = [l.strip() for l in remaining_text.split('\n') if l.strip()]
                    for next_line in lines[:2]:
                        if re.match(r'^[A-Z\s]+$', next_line) and not re.search(r'\b(?:FLAT|NO|ROAD|STREET|BUILDING|NEAR|OPP|DIST|THANE|MUMBAI|ZONE|UNIT|DATE|BILL|RS)\b', next_line, re.IGNORECASE):
                            line_cleaned += " " + next_line
                        else:
                            break
                return line_cleaned
        return "—"

    consumer_name = get_consumer_name_robust(text)
    if consumer_name == "—":
        consumer_name = find([
            r'Consumer\s*(?:No\.?|Number|ID)\s*:\s*\d+\s*Bill\s*Date\s*:\s*\S+(?:\s*\n+)*([A-Za-z\s]{3,40}?)\s+(?:Bill\s*Amount|Rs|Bill)',
            r'Consumer\s*Name\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,40})',
            r'Name\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]{3,40})',
            r'ग्राहकाचे\s*नाव\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,40})',
            r'ग्राहक\s*नाव\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,40})',
            r'नाव\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]{3,40})',
            r'([A-Za-z\u0900-\u097F\s]{3,40})\s+Bill\s+Amount',
        ])

    consumer_id = find([
        r'Consumer\s*(?:ID|No\.?|Number)\s*[:\-]?\s*([0-9]{5,15})',
        r'Account\s*(?:No|Number)\s*[:\-]?\s*([0-9]{5,15})',
        r'ग्राहक\s*(?:क्रमांक|क्र\.?)\s*[:\-]?\s*([0-9]{5,15})',
        r'\b([0-9]{12})\b',
    ])

    connection_num = find([
        r'(?:Connection|Meter|[मीमि]टर\s*(?:क्रमांक|क्र\.?)|ftrex|aie)\s*(?:Number|No\.?|aie)?\s*[:\-]?\s*([0-9A-Za-z\-]{8,15})',
        r'\b(\d{11})\b',
    ])

    # Extract Bill Date with fallback
    bill_date = find([
        r'देयक\s*दिनांक\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z]{3,10}[\/\-\s]\d{2,4})',
        r'Bill\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z]{3,10}[\/\-\s]\d{2,4})',
        r'\b\d{12}\b.*?\b(\d{1,2}-[A-Za-z]{3}-\d{2,4})\b',
        r'Bill\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'Date\s*of\s*Bill\s*[:\-]?\s*(\d{1,2}[\/\-][A-Za-z]{3,10}[\/\-]\d{2,4})',
        r'दिनांक\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'देयक\s*दिनांक\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
    ])

    due_date = find([
        r'देय\s*(?:दिनांक)?\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z]{3,10}[\/\-\s]\d{2,4})',
        r'Due\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z]{3,10}[\/\-\s]\d{2,4})',
        r'\b(?:Due|देय|feria|tari|अंतिम)\b\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z]{3,10}[\/\-\s]\d{2,4})',
        r'\b(?:Due|देय|feria|tari|अंतिम)\b\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'Payment\s*Due\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'Last\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-][A-Za-z]{3,10}[\/\-]\d{2,4})',
        r'देय\s*दिनांक\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'अंतिम\s*तारीख\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
    ])

    bill_status = find([
        r'Status\s*[:\-]?\s*(Paid|Unpaid|Pending|Due)',
        r'Payment\s*Status\s*[:\-]?\s*(Paid|Unpaid|Pending|Due)',
        r'देयक\s*स्थिती\s*[:\-]?\s*(Paid|Unpaid|Pending|Due)',
    ], default="Unpaid")

    # Usage
    prev_units = find_units([
        r'Previous\s*(?:Month\s*)?Units\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
        r'Units\s*(?:Last|Prev)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
    ])

    # Robust Current Units Parser
    def get_curr_units_robust(text):
        for m in re.finditer(r'(\d+)\s+(\d+)\s+([0-9Oo]+)\s+(\d+)\s+([0-9Oo]+)\s+(\d+)', text):
            try:
                curr_r = int(m.group(1))
                prev_r = int(m.group(2))
                mf_str = m.group(3).lower().replace('o', '0')
                mf = int(mf_str) if mf_str.isdigit() else 1
                diff = int(m.group(4))
                adj_str = m.group(5).lower().replace('o', '0')
                adj = int(adj_str) if adj_str.isdigit() else 0
                tot = int(m.group(6))
                if abs((curr_r - prev_r) * mf - tot) <= 5 or tot == diff or tot == abs(curr_r - prev_r):
                    return f"{tot} KWh"
            except Exception:
                continue
        return find_units([
            r'Current\s*(?:Month\s*)?Units\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
            r'Units\s*(?:This|Current)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
            r'Units\s*Consumed\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
            r'MF\s+Unit\s+Adj\.\s+Unit\s+Total[\s\S]{1,100}?\n\s*\d+\s+\d+\s+\d+\s+(\d+)',
            r'वापरलेली\s*युनिट्स\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
            r'एकूण\s*युनिट्स?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
            r'युनिट्स\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
            r'युनिट\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
        ])

    curr_units = get_curr_units_robust(text)

    prev_amount = "—"
    history_idx = text.lower().find("payment history")
    if history_idx != -1:
        history_text = text[history_idx:]
        history_match = re.findall(r'(\d{1,2}[-\/\s][A-Za-z]{3,10}[-\/\s]\d{2,4})[\)\s]*\s+([0-9\.,]+)', history_text)
        if history_match:
            prev_amt_val = history_match[0][1].strip().replace(',', '')
            if prev_amt_val.replace('.', '').isdigit():
                prev_amount = f"₹{int(float(prev_amt_val))}"

    curr_amount = find_amount([
        r'देयक\s*रक्कम\s*(?:रु)?\s*[:\-]?\s*([0-9,]+(?:\.[0-9]+)?)\b',
        r'देयकाची\s*निव्वळ\s*रक्कम\s*[:\-]?\s*([0-9,]+(?:\.[0-9]+)?)\b',
        r'पूर्णांक\s*देयक\s*\(?रु\.?\)?\s*([0-9,]+(?:\.[0-9]+)?)\b',
        r'\b(?:Rounded|Total|Net|eth\s*eae|Rounded\s*Bill|Net\s*Bill\s*Amount|Total\s*Current\s*Bill|Net\s*Payable|Bill\s*Amount|एकूण\s*देय\s*रक्कम|देय\s*रक्कम|एकूण\s*रक्कम)\b[^0-9\n]{0,20}([0-9,]+(?:\.[0-9]+)?)\b',
        r'Current\s*Amount\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'Net\s*(?:Payable|Amount)\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'Total\s*Amount\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'Rounded\s+Bill\s*\(?Rs\)?\s*([0-9,]+(?:\.[0-9]+)?)',
        r'एकूण\s*देय\s*रक्कम\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
    ])

    # Bill summary
    energy = find_amount([
        r'\b(?:Energy|Energy\s*Charges?|ate\s*STR|वीज\s*आकार|विद्युत\s*आकार|ऊर्जा\s*आकार)\b[^0-9\n]{0,20}([0-9,]+(?:\.[0-9]+)?)\b',
        r'Energy\s*Charges?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'विद्युत\s*आकार\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
    ])
    fixed = find_amount([
        r'\b(?:Fixed|Fixed\s*Charges?|PROTA|स्थिर|नियत)\b[^0-9\n]{0,20}([0-9,]+(?:\.[0-9]+)?)\b',
        r'Fixed\s*Charges?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'स्थिर\s*आकार\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
    ])
    fac_raw = find_amount([
        r'\b(?:Fuel|FAC|GARISH|इंधन)\b[^0-9\n]{0,20}([0-9,]+(?:\.[0-9]+)?)\b',
        r'(?:Fuel\s*Adj(?:ustment)?|FAC)\.?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'इंधन\s*समायोजन\s*आकार\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
    ])
    fac = fac_raw
    if fac and fac != "—":
        clean_fac = fac.replace("₹", "").replace(",", "").strip()
        try:
            val = float(clean_fac)
            if val >= 100 and val.is_integer():
                val = val / 100.0
            if val.is_integer():
                fac = f"₹{int(val):,}"
            else:
                fac = f"₹{val:,.2f}"
        except ValueError:
            pass

    duty = find_amount([
        r'\b(?:Duty|arora\s*erst|orora\s*erst|शुल्क|वीज\s*शुल्क)\b[^0-9\n]{0,20}(?:\(\d+\s*%\)[^0-9\n]{0,10})?([0-9,]+(?:\.[0-9]+)?)\b',
        r'Electricity\s*Duty\s*(?:\(\d+\s*%\))?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'विद्युत\s*शुल्क\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
    ])
    other = find_amount([r'Other\s*Charges?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)'])
    total = find_amount([
        r'देयक\s*रक्कम\s*(?:रु)?\s*[:\-]?\s*([0-9,]+(?:\.[0-9]+)?)\b',
        r'देयकाची\s*निव्वळ\s*रक्कम\s*[:\-]?\s*([0-9,]+(?:\.[0-9]+)?)\b',
        r'पूर्णांक\s*देयक\s*\(?रु\.?\)?\s*([0-9,]+(?:\.[0-9]+)?)\b',
        r'\b(?:Rounded|Total|Net|eth\s*eae|Rounded\s*Bill|Net\s*Bill\s*Amount|Total\s*Current\s*Bill|Net\s*Payable|Bill\s*Amount|एकूण\s*देय\s*रक्कम|देय\s*रक्कम|एकूण\s*रक्कम)\b[^0-9\n]{0,20}([0-9,]+(?:\.[0-9]+)?)\b',
    ])

    return {
        "company": {
            "name": company_name,
            "cin": cin,
            "website": website if website != "—" else "—",
            "toll": toll if toll != "—" else "—",
            "office": registered_office,
            "gstin": gstin,
        },
        "consumer": {
            "name": consumer_name,
            "id": consumer_id,
            "connection": connection_num,
            "billDate": bill_date,
            "dueDate": due_date,
        },
        "usage": {
            "prevUnits": prev_units,
            "prevAmount": prev_amount,
            "currUnits": curr_units,
            "currAmount": curr_amount,
            "status": bill_status if bill_status != "—" else "Unpaid",
        },
        "summary": {
            "energy": energy,
            "fixed": fixed,
            "fac": fac,
            "duty": duty,
            "other": other,
            "total": total,
        },
        "slabs": extract_slabs(),
    }


@app.route("/extract", methods=["POST"])
def extract():
    print("Flask /extract hit")
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file provided"}), 400

    try:
        file_bytes = file.read()
        filename = file.filename.lower()

        if filename.endswith(".pdf"):
            try:
                from pdf2image import convert_from_bytes
                
                # Look for poppler in common folders
                poppler_paths = [
                    r"C:\Program Files\poppler\bin",
                    r"C:\poppler\bin",
                    os.path.join(os.path.dirname(__file__), "poppler", "bin"),
                ]
                
                # Check winget packages directory dynamically
                winget_packages_dir = os.path.expandvars(r"%USERPROFILE%\AppData\Local\Microsoft\WinGet\Packages")
                if os.path.exists(winget_packages_dir):
                    for folder in os.listdir(winget_packages_dir):
                        if "poppler" in folder.lower():
                            target_path = os.path.join(winget_packages_dir, folder)
                            for root, dirs, files in os.walk(target_path):
                                if "pdftoppm.exe" in files:
                                    poppler_paths.append(root)
                                    break
                poppler_bin = None
                for p in poppler_paths:
                    if os.path.exists(p):
                        poppler_bin = p
                        break
                
                if poppler_bin:
                    pages = convert_from_bytes(file_bytes, dpi=200, poppler_path=poppler_bin)
                else:
                    pages = convert_from_bytes(file_bytes, dpi=200)
                text = ""

                for page in pages:
                    text += pytesseract.image_to_string(page, lang="eng+mar") + "\n"
            except Exception as pdf_err:
                print("PDF conversion error:", pdf_err)
                return jsonify({"error": "PDF processing failed", "detail": str(pdf_err)}), 500
        else:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            # Upscale small images for better OCR accuracy
            w, h = img.size
            if w < 1200:
                scale = 1200 / w
                img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
            text = pytesseract.image_to_string(img, lang="eng+mar")

        print("OCR raw text (first 400 chars):", ascii(text[:400]))
        text = translate_marathi_digits(text)
        parsed = parse_bill_text(text)
        parsed["rawText"] = text
        return jsonify(parsed)

    except Exception as e:
        print("Extract error:", repr(e))
        return jsonify({"error": "Extraction failed", "detail": str(e)}), 500


if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5001, debug=False)
