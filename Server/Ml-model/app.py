from flask import Flask, request, jsonify
import pandas as pd
import joblib

app = Flask(__name__)
@app.route("/predict", methods=["POST"])
ensemble_model =joblib.load("ensemble_model.pkl")
columns = joblib.load("feature_columns.pkl")

