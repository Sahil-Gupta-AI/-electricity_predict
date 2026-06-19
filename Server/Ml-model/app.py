from flask import Flask, request, jsonify
import pandas as pd
import joblib

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
