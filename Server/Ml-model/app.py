from flask import Flask, request, jsonify
import pandas as pd
import joblib
import pytesseract
from PIL import Image
import io
import re

app = Flask(__name__)

ensemble_model = joblib.load("ensemble_model.pkl")
columns = joblib.load("feature_columns.pkl")

print("Model loaded. Columns:", columns)

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


@app.route("/predict", methods=["POST"])
def predict():
    print("Flask /predict hit")

    data = request.json
    print("Received data:", data)

    month_raw = data["month"]
    units = float(data["unit"])
    amount = float(data["amount"])

   
    if isinstance(month_raw, int):
        month = month_raw
    else:
        from datetime import datetime
        try:
            month = int(month_raw)
        except (ValueError, TypeError):
            month = datetime.strptime(str(month_raw), "%b %Y").month

    print(f"Parsed month: {month}")
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

    # Amount 
    # def calculate_amounts(units):
    #     fixed_charge = 110
    #     energy_rate = 6.50
    #     fac_rate = 0.38
    #     duty_rate = 0.16

    #     # Charges
    #     energy_charge = units * energy_rate
    #     fac_charge = units * fac_rate

    #     # Subtotal before duty
    #     subtotal = fixed_charge + energy_charge + fac_charge
    #     duty = subtotal * duty_rate
    #     total_amount = subtotal + duty
    #     return round(total_amount, 2)

    # def calculate_amount(units):
    #     fixed_charge = 130
    #     duty_rate = 0.16

    #     energy_charge = 0
    #     fac_charge = 0

    #     if units <= 100:
    #         energy_charge += units * 4.28
    #         fac_charge += units * 0.10

    #     elif units <= 300:
    #         energy_charge += 100 * 4.28
    #         energy_charge += (units - 100) * 11.10

    #         fac_charge += 100 * 0.10
    #         fac_charge += (units - 100) * 0.15

    #     elif units <= 500:
    #         energy_charge += 100 * 4.28
    #         energy_charge += 200 * 11.10
    #         energy_charge += (units - 300) * 15.38

    #         fac_charge += 100 * 0.10
    #         fac_charge += 200 * 0.15
    #         fac_charge += (units - 300) * 0.20

    #     elif units <= 1000:
    #         energy_charge += 100 * 4.28
    #         energy_charge += 200 * 11.10
    #         energy_charge += 200 * 15.38
    #         energy_charge += (units - 500) * 17.68

    #         fac_charge += 100 * 0.10
    #         fac_charge += 200 * 0.15
    #         fac_charge += 200 * 0.20
    #         fac_charge += (units - 500) * 0.20

    #     else:
    #         energy_charge += 100 * 4.28
    #         energy_charge += 200 * 11.10
    #         energy_charge += 200 * 15.38
    #         energy_charge += 500 * 17.68
    #         energy_charge += (units - 1000) * 17.68

    #         fac_charge += 100 * 0.10
    #         fac_charge += 200 * 0.15
    #         fac_charge += 200 * 0.20
    #         fac_charge += 500 * 0.20
    #         fac_charge += (units - 1000) * 0.20

    #     subtotal = fixed_charge + energy_charge + fac_charge
    #     duty = subtotal * duty_rate

    #     return round(subtotal + duty, 2)


    def calculate_amount(predicted_units, current_units, current_amount):
        if current_units <= 0:
            return current_amount

        predicted_amount = current_amount * (predicted_units / current_units)

        return round(predicted_amount, 2)
    
    
    predictAmount = calculate_amount(predictUnit, units, amount)
    return jsonify({
        "predictUnit": predictUnit,
        "month": month,
        "unit": units,
        "amount": amount,
        "predictAmount":predictAmount
                   })


def parse_bill_text(text):
    """Extract structured fields from OCR raw text of an electricity bill."""
    def find(patterns, default="—"):
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return default

    def find_amount(patterns, default="—"):
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                raw = m.group(1).replace(",", "").strip()
                return f"₹{int(float(raw)):,}" if raw.replace('.','').isdigit() else f"₹{raw}"
        return default

    def find_units(patterns, default="—"):
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return f"{m.group(1).strip()} KWh"
        return default

    # Company
    company_name = find([
        r'(Tata Power[^\n]+)',
        r'(MSEDCL[^\n]+)',
        r'(Adani[^\n]+)',
        r'(Torrent[^\n]+)',
        r'(BSES[^\n]+)',
        r'Company\s*[:\-]?\s*([^\n]+)',
    ])
    cin = find([r'CIN\s*[:\-]?\s*([A-Z0-9]+)', r'U\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}'])
    gstin = find([r'GSTIN\s*[:\-]?\s*([A-Z0-9]+)', r'\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}'])
    website = find([r'www\.[a-zA-Z0-9\-\.]+\.[a-z]{2,}'])
    toll = find([r'(\d{4,6})\s*\(?Toll[- ]Free\)?', r'Toll\s*Free\s*[:\-]?\s*([0-9\- ]+)'])

    # Registered office
    office_lines = re.findall(r'(?:Registered Office|NDPL House|Hudson Lines)[^\n]*', text, re.IGNORECASE)
    registered_office = " ".join(office_lines[:2]) if office_lines else "—"

    # Consumer
    consumer_name = find([
        r'Consumer\s*Name\s*[:\-]?\s*([A-Za-z ]{3,40})',
        r'Name\s*[:\-]\s*([A-Za-z ]{3,40})',
    ])
    consumer_id = find([
        r'Consumer\s*(?:ID|No\.?|Number)\s*[:\-]?\s*([0-9]{5,15})',
        r'Account\s*(?:No|Number)\s*[:\-]?\s*([0-9]{5,15})',
    ])
    connection_num = find([
        r'Connection\s*(?:Number|No\.?)\s*[:\-]?\s*([0-9]{5,15})',
        r'Meter\s*(?:No\.?|Number)\s*[:\-]?\s*([0-9A-Z\-]{5,20})',
    ])
    bill_date = find([
        r'Bill\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z]{3}[\/\-\s]\d{2,4})',
        r'Bill\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'Date\s*of\s*Bill\s*[:\-]?\s*(\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{2,4})',
    ])
    due_date = find([
        r'Due\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-\s][A-Za-z]{3}[\/\-\s]\d{2,4})',
        r'Payment\s*Due\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'Last\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{2,4})',
    ])
    bill_status = find([r'(Paid|Unpaid|Pending|Due)', r'Status\s*[:\-]?\s*(Paid|Unpaid|Pending)'])

    # Usage
    prev_units = find_units([
        r'Previous\s*(?:Month\s*)?Units\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
        r'Units\s*(?:Last|Prev)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
    ])
    curr_units = find_units([
        r'Current\s*(?:Month\s*)?Units\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
        r'Units\s*(?:This|Current)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
        r'Units\s*Consumed\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)',
    ])
    prev_amount = find_amount([
        r'Previous\s*(?:Month\s*)?Amount\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'Amount\s*(?:Last|Prev)\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
    ])
    curr_amount = find_amount([
        r'Current\s*Amount\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'Net\s*(?:Payable|Amount)\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'Total\s*Amount\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
    ])

    # Bill summary
    energy = find_amount([r'Energy\s*Charges?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)'])
    fixed  = find_amount([r'Fixed\s*Charges?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)'])
    fac    = find_amount([r'(?:Fuel\s*Adj(?:ustment)?|FAC)\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)'])
    duty   = find_amount([r'Electricity\s*Duty\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)'])
    other  = find_amount([r'Other\s*Charges?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)'])
    total  = find_amount([
        r'Total\s*Amount\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'Grand\s*Total\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'Net\s*Payable\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
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
        "slabs": [
            {"range": "0 – 100",   "rate": "₹4.21", "desc": "First 100 units"},
            {"range": "101 – 300", "rate": "₹6.00", "desc": "Next 200 units"},
            {"range": "301 – 500", "rate": "₹7.50", "desc": "Next 200 units"},
            {"range": "501+",      "rate": "₹8.75", "desc": "Above 500 units"},
        ],
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
                pages = convert_from_bytes(file_bytes, dpi=200)
                text = ""
                for page in pages:
                    text += pytesseract.image_to_string(page, lang="eng") + "\n"
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
            text = pytesseract.image_to_string(img, lang="eng")

        print("OCR raw text (first 400 chars):", text[:400])
        parsed = parse_bill_text(text)
        parsed["rawText"] = text
        return jsonify(parsed)

    except Exception as e:
        print("Extract error:", e)
        return jsonify({"error": "Extraction failed", "detail": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
