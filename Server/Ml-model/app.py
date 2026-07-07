from flask import Flask, request, jsonify
import pandas as pd
import joblib
import pytesseract
from PIL import Image
import io
import re
import os
import urllib.request
import urllib.parse
import json

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
print("Model 1 loaded. Columns:", columns)

ensemble_model_2 = None
columns_2 = None
if os.path.exists("ensemble_model_2.pkl") and os.path.exists("feature_columns_2.pkl"):
    ensemble_model_2 = joblib.load("ensemble_model_2.pkl")
    columns_2 = joblib.load("feature_columns_2.pkl")
    print("Model 2 loaded. Columns:", columns_2)

ensemble_model_3 = None
columns_3 = None
if os.path.exists("ensemble_model_3.pkl") and os.path.exists("feature_columns_3.pkl"):
    ensemble_model_3 = joblib.load("ensemble_model_3.pkl")
    columns_3 = joblib.load("feature_columns_3.pkl")
    print("Model 3 loaded. Columns:", columns_3)

ensemble_model_4 = None
columns_4 = None
if os.path.exists("ensemble_model_4.pkl") and os.path.exists("feature_columns_4.pkl"):
    ensemble_model_4 = joblib.load("ensemble_model_4.pkl")
    columns_4 = joblib.load("feature_columns_4.pkl")
    print("Model 4 loaded. Columns:", columns_4)

ensemble_model_5 = None
columns_5 = None
if os.path.exists("ensemble_model_5.pkl") and os.path.exists("feature_columns_5.pkl"):
    ensemble_model_5 = joblib.load("ensemble_model_5.pkl")
    columns_5 = joblib.load("feature_columns_5.pkl")
    print("Model 5 loaded. Columns:", columns_5)

ensemble_model_6 = None
columns_6 = None
if os.path.exists("ensemble_model_6.pkl") and os.path.exists("feature_columns_6.pkl"):
    ensemble_model_6 = joblib.load("ensemble_model_6.pkl")
    columns_6 = joblib.load("feature_columns_6.pkl")
    print("Model 6 loaded. Columns:", columns_6)


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

days_in_month = {
    1: 31,
    2: 28,
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31
}


tariffs = {
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


def calculate_default_tariff(company_key, units):
    if units is None or units <= 0:
        return 0
    company_key = str(company_key).lower().strip()
    
    if company_key not in tariffs:
        return None
        
    slabs = tariffs[company_key]
    
    # 1. Determine Fixed Charge based on the highest slab reached
    fixed_charge = 0
    for limit, fixed, _, _, _, _ in slabs:
        fixed_charge = fixed
        if units <= limit:
            break
            
    # 2. Calculate cumulative energy charges
    energy_charge = 0
    remaining_units = units
    prev_limit = 0
    for limit, _, energy, fac, wheeling, _ in slabs:
        slab_units = min(remaining_units, limit - prev_limit)
        if slab_units <= 0:
            break
        rate = energy + fac + wheeling
        energy_charge += slab_units * rate
        remaining_units -= slab_units
        prev_limit = limit
        
    subtotal = fixed_charge + energy_charge
    duty = subtotal * 0.16
    return round(subtotal + duty)


def get_lat_lon(city_name):
    default_coords = (19.0760, 72.8777)  # Mumbai
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city_name)}&count=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get("results"):
                res = data["results"][0]
                return float(res["latitude"]), float(res["longitude"])
    except Exception as e:
        print("Geocoding failed for:", city_name, e, flush=True)
    return default_coords


def get_monthly_avg_temp(city_name, month_num):
    lat, lon = get_lat_lon(city_name)
    
    # We query the average temperature for the same month in 2025 (representative historical year)
    year = 2025
    start_date = f"{year}-{month_num:02d}-01"
    
    # Determine end day of month
    if month_num in [4, 6, 9, 11]:
        end_day = 30
    elif month_num == 2:
        end_day = 28
    else:
        end_day = 31
    end_date = f"{year}-{month_num:02d}-{end_day}"
    
    try:
        url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={start_date}&end_date={end_date}&daily=temperature_2m_mean&timezone=auto"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode('utf-8'))
            if "daily" in data and "temperature_2m_mean" in data["daily"]:
                temps = [t for t in data["daily"]["temperature_2m_mean"] if t is not None]
                if temps:
                    avg_temp = sum(temps) / len(temps)
                    print(f"Weather API Success: Resolved avg temp for {city_name} in month {month_num} as {avg_temp:.2f}°C", flush=True)
                    return round(avg_temp, 2)
    except Exception as e:
        print("Archive Weather API failed for:", city_name, e, flush=True)
    
    # Fallback to default monthly temp map if API fails
    print(f"Weather API Fallback: Using default temp for {city_name} in month {month_num} as {temp_map.get(month_num, 28)}°C", flush=True)
    return temp_map.get(month_num, 28)


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
        wm_hours = float(appliances_data.get("wm", 0)) * float(appliances_data.get("wm_qty", 1))
        geyser_hours = float(appliances_data.get("geyser", 0)) * float(appliances_data.get("geyser_qty", 1))
        bulb_hours = float(appliances_data.get("bulb", 0)) * float(appliances_data.get("bulb_qty", 1))
        
        # extra category
        other_hours = float(appliances_data.get("other", 0)) * float(appliances_data.get("other_qty", 1))
        extra_units = 30.0 * (0.1 * other_hours)
        
        provider = data.get("provider", "none")
        
        provider_to_company = {
            "tata": "Tata Power",
            "adani": "Adani Electricity",
            "msedcl": "MSEDCL",
            "torrent": "Torrent Power",
            "best": "BEST",
            "none": "Tata Power"
        }
        
        company = provider_to_company.get(provider.lower(), "Tata Power")
            
        print(f"Appliance input details: month={month}, company={ascii(company)}")
        
        input_data = {
            "Ceiling Fan (Hrs/Day)": fan_hours,
            "Refrigerator (Hrs/Day)": fridge_hours,
            "Air Conditioner (Hrs/Day)": ac_hours,
            "Television LED (Hrs/Day)": tv_hours,
            "Desktop Computer (Hrs/Day)": monitor_hours,
            "Washing Machine (Hrs/Day)": wm_hours,
            "Geyser / Water Heater (Hrs/Day)": geyser_hours,
            "LED Bulb (Hrs/Day)": bulb_hours,
            "Month_Num": month,
            "Company Name": company
        }
        
        df_input = pd.DataFrame([input_data])
        df_encoded = pd.get_dummies(df_input, columns=["Company Name"])
        df_encoded = df_encoded.reindex(columns=appliance_columns, fill_value=0)
        
        print("Appliance Input DataFrame shape:", df_encoded.shape)
        
        predicted_raw = float(appliance_model.predict(df_encoded)[0])
        # Physical estimation to check if inputs are low-value out-of-distribution
        raw_kwh = (
            fan_hours * 75 +
            fridge_hours * 250 +
            ac_hours * 1500 +
            tv_hours * 100 +
            monitor_hours * 200 +
            wm_hours * 500 +
            geyser_hours * 2000 +
            bulb_hours * 12
        ) * 30 / 1000.0
        
        if raw_kwh < 53 and raw_kwh > 0:
            predictUnit = round(predicted_raw * (raw_kwh / 53.0) + extra_units)
        else:
            predictUnit = max(round(predicted_raw + extra_units), 0)  # Ensure non-negative
        
        # Calculate amount properly using tariff details if available
        fixed = parse_tariff_value(data.get("fixedCharge"))
        rate = parse_tariff_value(data.get("energyRate"))
        fac_rate = parse_tariff_value(data.get("fac"))
        # If FAC is passed as a flat charge (larger than standard unit rates, e.g. > 1.50/KWh), fall back to standard 0.40/KWh
        if fac_rate > 1.5:
            fac_rate = 0.40
        
        duty_val = data.get("duty", "")
        # If duty is a currency amount (contains rupee/Rs or doesn't contain %), fall back to 16.0% default
        if isinstance(duty_val, str) and ("₹" in duty_val or "Rs" in duty_val or "%" not in duty_val):
            duty_pct = 16.0
        else:
            duty_pct = parse_tariff_value(duty_val)
            if duty_pct == 0:
                duty_pct = 16.0
        
        default_amount = calculate_default_tariff(provider, predictUnit)
        if rate > 0:
            energy_charges = predictUnit * rate
            fac_charges = predictUnit * fac_rate
            subtotal = fixed + energy_charges + fac_charges
            duty_charge = subtotal * (duty_pct / 100.0)
            tariff_pred = subtotal + duty_charge
            
            if units > 0 and amount > 0:
                energy_prev = units * rate
                fac_prev = units * fac_rate
                subtotal_prev = fixed + energy_prev + fac_prev
                duty_prev = subtotal_prev * (duty_pct / 100.0)
                tariff_prev = subtotal_prev + duty_prev
                
                if tariff_prev > 0:
                    scaling_factor = amount / tariff_prev
                    scaling_factor = max(0.75, min(1.50, scaling_factor))
                    predictAmount = round(tariff_pred * scaling_factor)
                else:
                    predictAmount = round(tariff_pred)
            else:
                predictAmount = round(tariff_pred)
        elif default_amount is not None:
            if units > 0 and amount > 0:
                default_prev = calculate_default_tariff(provider, units)
                if default_prev is not None and default_prev > 0:
                    scaling_factor = amount / default_prev
                    scaling_factor = max(0.75, min(1.50, scaling_factor))
                    predictAmount = round(default_amount * scaling_factor)
                else:
                    predictAmount = default_amount
            else:
                predictAmount = default_amount
        else:
            if units > 0:
                predictAmount = round(amount * (predictUnit / units))
            else:
                predictAmount = round(amount)
            
        print(f"Appliance prediction: predictUnit={predictUnit}, predictAmount={predictAmount}")
        
        return jsonify({
            "predictUnit": predictUnit,
            "month": month_raw,
            "unit": units,
            "amount": amount,
            "predictAmount": predictAmount
        })

    else:
        provider = data.get("provider", "none")
        city = data.get("city")
        if not city or city == "—":
            provider_to_city = {
                "tata": "Mumbai",
                "adani": "Mumbai",
                "msedcl": "Mumbai",
                "torrent": "Thane",
                "best": "Mumbai",
                "none": "Mumbai"
            }
            city = provider_to_city.get(str(provider).lower(), "Mumbai")
        temp = get_monthly_avg_temp(city, month)
        season = get_season(month)

        # Check how many consecutive previous months' data are provided
        consecutive_lags = 1
        
        # Build features dict dynamically
        lags_data = {
            1: {"unit": units, "amount": amount}
        }
        
        for lag in range(2, 7):
            u_val = data.get(f"unit{lag}")
            a_val = data.get(f"amount{lag}")
            if u_val is not None and a_val is not None:
                try:
                    lags_data[lag] = {"unit": float(u_val), "amount": float(a_val)}
                    if consecutive_lags == lag - 1:
                        consecutive_lags = lag
                except (ValueError, TypeError):
                    break
            else:
                break
        
        tariff_category = data.get("tariffCategory", "Residential")

        # Normalize Tariff Category
        valid_categories = ["Residential", "Commercial", "Industrial"]
        if tariff_category not in valid_categories:
            matched = False
            for t in valid_categories:
                if t.lower() == str(tariff_category).lower():
                    tariff_category = t
                    matched = True
                    break
            if not matched:
                tariff_category = "Residential"

        predicted_raw = None
        model_to_use = None
        cols_to_use = None
        
        if consecutive_lags == 6 and ensemble_model_6 is not None:
            model_to_use = ensemble_model_6
            cols_to_use = columns_6
        elif consecutive_lags == 5 and ensemble_model_5 is not None:
            model_to_use = ensemble_model_5
            cols_to_use = columns_5
        elif consecutive_lags == 4 and ensemble_model_4 is not None:
            model_to_use = ensemble_model_4
            cols_to_use = columns_4
        elif consecutive_lags == 3 and ensemble_model_3 is not None:
            model_to_use = ensemble_model_3
            cols_to_use = columns_3
        elif consecutive_lags == 2 and ensemble_model_2 is not None:
            model_to_use = ensemble_model_2
            cols_to_use = columns_2
            
        if model_to_use is not None and cols_to_use is not None:
            print(f"{consecutive_lags}-month lag prediction model selected.")
            input_data = {
                "Month": month,
                "Temp": temp,
                "Billing_Days": days_in_month.get(month, 30),
                "Season_PostMonsoon": 1 if season == "PostMonsoon" else 0,
                "Season_Summer": 1 if season == "Summer" else 0,
                "Season_Winter": 1 if season == "Winter" else 0,
                "Tariff_Category_Commercial": 1 if tariff_category == "Commercial" else 0,
                "Tariff_Category_Industrial": 1 if tariff_category == "Industrial" else 0,
                "Tariff_Category_Residential": 1 if tariff_category == "Residential" else 0
            }
            # Add all required lags
            for lag in range(1, consecutive_lags + 1):
                unit_col_name = "Units_30d" if lag == 1 else f"Units_{lag*30}d"
                amt_col_name = "Amount" if lag == 1 else f"Amount_{lag*30}d"
                input_data[unit_col_name] = lags_data[lag]["unit"]
                input_data[amt_col_name] = lags_data[lag]["amount"]
                
            df = pd.DataFrame([input_data])
            df = df[cols_to_use]
            print(f"{consecutive_lags}-month DataFrame:\n", df)
            predicted_raw = float(model_to_use.predict(df)[0])
        else:
            # Fallback to 1-month model
            print("1-month lag prediction model selected (fallback or default).")
            input_data = {
                "Units_30d": units,
                "Month": month,
                "Temp": temp,
                "Amount": amount,
                "Billing_Days": days_in_month.get(month, 30),
                "Season_PostMonsoon": 1 if season == "PostMonsoon" else 0,
                "Season_Summer": 1 if season == "Summer" else 0,
                "Season_Winter": 1 if season == "Winter" else 0,
                "Tariff_Category_Commercial": 1 if tariff_category == "Commercial" else 0,
                "Tariff_Category_Industrial": 1 if tariff_category == "Industrial" else 0,
                "Tariff_Category_Residential": 1 if tariff_category == "Residential" else 0
            }
            df = pd.DataFrame([input_data])
            df = df[columns]
            print("1-month DataFrame:\n", df)
            predicted_raw = float(ensemble_model.predict(df)[0])

        # If the input units are below the training set range, scale the prediction linearly (only for 1-month model)
        if consecutive_lags == 1 and units < 53 and units > 0:
            predictUnit = round(predicted_raw * (units / 53.0))
        else:
            predictUnit = max(round(predicted_raw), 0)  # Ensure non-negative unit prediction

        # Calculate amount properly using tariff details if available
        fixed = parse_tariff_value(data.get("fixedCharge"))
        rate = parse_tariff_value(data.get("energyRate"))
        fac_rate = parse_tariff_value(data.get("fac"))
        # If FAC is passed as a flat charge (larger than standard unit rates, e.g. > 1.50/KWh), fall back to standard 0.40/KWh
        if fac_rate > 1.5:
            fac_rate = 0.40
        
        duty_val = data.get("duty", "")
        # If duty is a currency amount (contains rupee/Rs or doesn't contain %), fall back to 16.0% default
        if isinstance(duty_val, str) and ("₹" in duty_val or "Rs" in duty_val or "%" not in duty_val):
            duty_pct = 16.0
        else:
            duty_pct = parse_tariff_value(duty_val)
            if duty_pct == 0:
                duty_pct = 16.0

        default_amount = calculate_default_tariff(provider, predictUnit)
        if rate > 0:
            energy_charges = predictUnit * rate
            fac_charges = predictUnit * fac_rate
            subtotal = fixed + energy_charges + fac_charges
            duty_charge = subtotal * (duty_pct / 100.0)
            tariff_pred = subtotal + duty_charge
            
            if units > 0 and amount > 0:
                energy_prev = units * rate
                fac_prev = units * fac_rate
                subtotal_prev = fixed + energy_prev + fac_prev
                duty_prev = subtotal_prev * (duty_pct / 100.0)
                tariff_prev = subtotal_prev + duty_prev
                
                if tariff_prev > 0:
                    scaling_factor = amount / tariff_prev
                    scaling_factor = max(0.75, min(1.50, scaling_factor))
                    predictAmount = round(tariff_pred * scaling_factor)
                else:
                    predictAmount = round(tariff_pred)
            else:
                predictAmount = round(tariff_pred)
        elif default_amount is not None:
            if units > 0 and amount > 0:
                default_prev = calculate_default_tariff(provider, units)
                if default_prev is not None and default_prev > 0:
                    scaling_factor = amount / default_prev
                    scaling_factor = max(0.75, min(1.50, scaling_factor))
                    predictAmount = round(default_amount * scaling_factor)
                else:
                    predictAmount = default_amount
            else:
                predictAmount = default_amount
        else:
            if units > 0:
                predictAmount = round(amount * (predictUnit / units))
            else:
                predictAmount = round(amount)

        print(f"History prediction: predictUnit={predictUnit}, predictAmount={predictAmount}")

        res_dict = {
            "predictUnit": predictUnit,
            "month": month_raw,
            "unit": units,
            "amount": amount,
            "predictAmount": predictAmount
        }
        for lag in range(2, consecutive_lags + 1):
            if lag in lags_data:
                res_dict[f"unit{lag}"] = lags_data[lag]["unit"]
                res_dict[f"amount{lag}"] = lags_data[lag]["amount"]
        return jsonify(res_dict)


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
                    return f"₹{round(val_float):,}"
                except ValueError:
                    return f"₹{raw}"
        return default

    def find_units(patterns, default="—"):
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = m.group(1) if m.groups() else m.group(0)
                try:
                    val_float = float(val)
                    return f"{round(val_float)} KWh"
                except ValueError:
                    return f"{val.strip()} KWh"
        return default

    def extract_slabs():
        # Determine the company key to select the correct company's default slabs
        company_key = "tata"
        for key in ["torrent", "msedcl", "tata", "adani", "best"]:
            if key in text.lower() or (key == "msedcl" and "mahavitaran" in text.lower()) or (key == "msedcl" and "mahadiscom" in text.lower()) or (key == "msedcl" and "महावितरण" in text.lower()):
                company_key = key
                break
                
        # Build dynamic default slabs based on standard tariff tables
        default_slabs = []
        clean_slab_names = ["First 100 units", "Next 200 units", "Next 200 units", "Next 500 units", "Above 1000 units"]
        company_slabs = tariffs.get(company_key, tariffs["tata"])
        prev_limit = 0
        for i, (limit, _, energy_rate, fac_rate, wheeling_rate, _) in enumerate(company_slabs):
            total_rate = energy_rate
            if limit == float('inf'):
                s_range = f"{prev_limit + 1}+"
            else:
                s_range = f"{prev_limit + 1} – {limit}" if prev_limit > 0 else f"0 – {limit}"
            
            desc = clean_slab_names[i] if i < len(clean_slab_names) else "Above 500 units"
            default_slabs.append({
                "range": s_range,
                "rate": f"₹{total_rate:.2f}",
                "desc": desc
            })
            prev_limit = limit

        # 1. Extract wheeling charge from the bill if present
        wheeling_charge = None
        wheel_match = re.search(r'(?:वहन|AeA|wheel)[^\n\d]*([0-9\.]+)', text, re.IGNORECASE)
        if wheel_match:
            try:
                wheeling_charge = float(wheel_match.group(1))
            except ValueError:
                pass
        
        if wheeling_charge is None:
            # Fallback based on company defaults
            if company_key == "msedcl":
                wheeling_charge = 1.60
            elif company_key == "tata":
                wheeling_charge = 2.76
            elif company_key == "adani":
                wheeling_charge = 2.28
            elif company_key == "torrent":
                wheeling_charge = 1.47
            elif company_key == "best":
                wheeling_charge = 1.87
            else:
                wheeling_charge = 0.0

        # 2. Scan all lines in the text to find candidate rate rows
        lines_list = text.split('\n')
        
        base_rates_candidate = None
        fac_rates_candidate = None
        
        for line in lines_list:
            line = line.strip()
            if not line:
                continue
                
            # Clean the line to keep only numbers and dots
            # Convert Marathi digits to English digits
            marathi_to_english = {'०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'}
            for mar, eng in marathi_to_english.items():
                line = line.replace(mar, eng)
                
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
                    
                    # Check 5-slab match
                    if len(subset_5) == 5:
                        if (1.5 <= subset_5[0] <= 6.5 and 
                            4.0 <= subset_5[1] <= 14.0 and 
                            6.0 <= subset_5[2] <= 19.0 and 
                            8.0 <= subset_5[3] <= 22.0 and
                            8.0 <= subset_5[4] <= 22.0):
                            base_rates_candidate = subset_5
                            break
                            
                    # Check 4-slab match
                    if (1.5 <= subset_4[0] <= 6.5 and 
                        4.0 <= subset_4[1] <= 14.0 and 
                        6.0 <= subset_4[2] <= 19.0 and 
                        8.0 <= subset_4[3] <= 22.0):
                        base_rates_candidate = subset_4
                        break
                
                # Check for FAC row: length 4 or 5, all values are small (e.g. 0 to 1.5)
                is_fac_line = any(w in line.lower() for w in ["fac", "इंस", "इंधन", "adjustment", "fuel"])
                if is_fac_line:
                    for start_idx in range(len(numbers) - 3):
                        subset_5 = numbers[start_idx:start_idx + 5]
                        subset_4 = numbers[start_idx:start_idx + 4]
                        if len(subset_5) == 5 and all(0 <= f <= 1.5 for f in subset_5):
                            fac_rates_candidate = subset_5
                            break
                        if len(subset_4) == 4 and all(0 <= f <= 1.5 for f in subset_4):
                            fac_rates_candidate = subset_4
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
                fac = fac_rates_candidate[i] if (fac_rates_candidate and i < len(fac_rates_candidate)) else 0.0
                
                total_rate = base
                
                slabs.append({
                    "range": ranges[i],
                    "rate": f"₹{total_rate:.2f}",
                    "desc": descriptions[i]
                })
            return slabs
            
        return default_slabs

    # Company
    company_name = find([
        r'(Torrent Power[^\n]*)',
        r'(MSEDCL[^\n]*)',
        r'(महावितरण[^\n]*)',
        r'(महाराष्ट्र राज्य विद्युत[^\n]*)',
        r'(Tata Power[^\n]*)',
        r'(Adani[^\n]*)',
        r'(BSES[^\n]*)',
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

    # Extract Tariff Category
    def get_tariff_category_robust(text):
        text_lower = text.lower()
        if "commercial" in text_lower or "non-residential" in text_lower or "non residential" in text_lower or "lt-ii" in text_lower or "lt-2" in text_lower:
            return "Commercial"
        elif "industrial" in text_lower or "lt-iii" in text_lower or "lt-3" in text_lower:
            return "Industrial"
        else:
            return "Residential"
    tariff_cat_extracted = get_tariff_category_robust(text)

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
    payment_history = []
    
    # Robust start index matching for billing history table
    history_idx = -1
    keywords = ["payment history", "receipt date", "paid amount", "भरणा तपशील", "payment detail"]
    text_lower = text.lower()
    for kw in keywords:
        idx = text_lower.find(kw)
        if idx != -1:
            history_idx = idx
            break
            
    if history_idx != -1:
        history_text = text[history_idx:]
        history_match = re.findall(r'(\d{1,2}[-\/\s][A-Za-z]{3,10}[-\/\s]\d{2,4})[\)\s]*\s+([0-9\.,]+)', history_text)
        if history_match:
            prev_amt_val = history_match[0][1].strip().replace(',', '')
            if prev_amt_val.replace('.', '').isdigit():
                prev_amount = f"₹{int(float(prev_amt_val))}"
            
            for date_str, amt_str in history_match[:6]:
                clean_amt = amt_str.replace(',', '').strip()
                if clean_amt.replace('.', '').isdigit():
                    payment_history.append({
                        "date": date_str,
                        "amount": f"₹{int(float(clean_amt))}"
                    })

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
        r'\b(?:Energy\s*Charges?|ate\s*STR|वीज\s*आकार|विद्युत\s*आकार|ऊर्जा\s*आकार)\b[^0-9\n]{0,20}([0-9,]+(?:\.[0-9]+)?)\b',
        r'Energy\s*Charges?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'विद्युत\s*आकार\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'(?xt)(?<!/)\bEnergy\b[^0-9\n]{0,20}([0-9,]+(?:\.[0-9]+)?)\b',
    ])
    fixed = find_amount([
        r'\b(?:Fixed|Fixed\s*Charges?|PROTA|स्थिर|नियत)\b[^0-9\n]{0,20}([0-9,]+(?:\.[0-9]+)?)\b',
        r'Fixed\s*Charges?\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
        r'स्थिर\s*आकार\s*[:\-]?\s*[₹Rs\.]*\s*([0-9,]+(?:\.[0-9]+)?)',
    ])
    
    # Override fixed charge if we can extract a standard base fixed charge from the table
    base_fixed_charge = None
    table_keywords = ["fix", "fixed", "स्थिर"]
    lines_summary = text.split('\n')
    for idx, line in enumerate(lines_summary):
        line_lower = line.lower()
        if any(kw in line_lower for kw in table_keywords):
            for offset in [0, 1, 2]:
                if idx + offset < len(lines_summary):
                    search_line = lines_summary[idx + offset]
                    integers = re.findall(r'\b\d{2,3}\b', search_line)
                    for val_str in integers:
                        val = int(val_str)
                        if val in [90, 130, 135, 160]:
                            base_fixed_charge = val
                            break
                if base_fixed_charge:
                    break
        if base_fixed_charge:
            break
            
    if base_fixed_charge:
        fixed = f"₹{base_fixed_charge}"

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

    # Detect city from text
    cities = ["Mumbai", "Thane", "Pune", "Bhiwandi", "Ahmedabad", "Surat", "Nagpur", "Nashik", "Navi Mumbai", "Kalyan", "Dombivli", "Kalwa", "Mumbra", "Vasai", "Virar", "Mira Bhayandar"]
    detected_city = "Mumbai"
    text_lower = text.lower()
    for c in cities:
        if c.lower() in text_lower:
            detected_city = c
            break

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
            "city": detected_city,
            "tariffCategory": tariff_cat_extracted,
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
        "history": payment_history,
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


users = []  # simple in-memory store for registered users

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    print(f"[AUTH] Login attempt - Email: {repr(email)}, Password: {repr(password)}")
    print(f"[AUTH] Current users store: {repr(users)}")
    # Search in registered users
    for u in users:
        if u["email"].strip().lower() == email.lower() and u["password"] == password:
            token = "demo-token"
            user = {"email": email, "name": f"{u.get('fname', '')} {u.get('lname', '')}".strip()}
            print(f"[AUTH] Login successful for: {email}")
            return jsonify({"token": token, "user": user})
    # fallback to demo credentials for testing
    if email.lower() == "test@example.com" and password == "password":
        token = "demo-token"
        user = {"email": email, "name": "Test User"}
        print("[AUTH] Login successful via fallback demo credentials")
        return jsonify({"token": token, "user": user})
    print("[AUTH] Login failed: invalid credentials")
    return jsonify({"message": "Invalid credentials"}), 401






@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    print(f"[AUTH] Register attempt with data: {repr(data)}")
    required = ["fname", "lname", "email", "password"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        print(f"[AUTH] Register failed: missing fields {missing}")
        return jsonify({"message": f"Missing fields: {', '.join(missing)}"}), 400
    # Simulate user creation and store in memory
    user = {
        "fname": data["fname"].strip(),
        "lname": data["lname"].strip(),
        "email": data["email"].strip(),
        "password": data["password"]
    }
    users.append(user)
    print(f"[AUTH] User registered successfully: {repr(user)}")
    print(f"[AUTH] Current users store now contains {len(users)} users")
    return jsonify({"message": "User registered successfully", "user": {"fname": user["fname"], "lname": user["lname"], "email": user["email"]}}), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
