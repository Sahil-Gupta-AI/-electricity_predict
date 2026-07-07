import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error
import joblib
import os

def main():
    file_path = 'Electricity_Appliance_Bill_Dataset.xlsx'
    if not os.path.exists(file_path):
        file_path = 'e:/Internship/electricity-bill/Server/Ml-model/Electricity_Appliance_Bill_Dataset.xlsx'
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    print("Loading dataset...")
    df = pd.read_excel(file_path)
    
    # Parse month to numeric
    df['Month_Num'] = pd.to_datetime(df['Month'], format='%b-%Y').dt.month
    
    # ------------------
    # 1. Train Appliance Model
    # ------------------
    feature_cols = [
        'Ceiling Fan (Hrs/Day)', 'Refrigerator (Hrs/Day)', 'Air Conditioner (Hrs/Day)',
        'Television LED (Hrs/Day)', 'Desktop Computer (Hrs/Day)', 'Washing Machine (Hrs/Day)',
        'Geyser / Water Heater (Hrs/Day)', 'LED Bulb (Hrs/Day)', 'Month_Num', 'Company Name'
    ]
    target_col = 'Monthly kWh'
    
    X_app = df[feature_cols]
    y_app = df[target_col]
    
    # One-hot encode Company Name
    X_app_encoded = pd.get_dummies(X_app, columns=['Company Name'])
    appliance_columns_list = list(X_app_encoded.columns)
    
    print(f"Appliance features count after one-hot encoding: {len(appliance_columns_list)}")
    print("Appliance columns:", appliance_columns_list)
    
    X_train_app, X_test_app, y_train_app, y_test_app = train_test_split(
        X_app_encoded, y_app, test_size=0.2, random_state=42
    )
    
    print("Training XGBoost Regressor model on appliance data...")
    app_model = XGBRegressor(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    app_model.fit(X_train_app, y_train_app)
    
    y_pred_app = app_model.predict(X_test_app)
    r2_app = r2_score(y_test_app, y_pred_app)
    mae_app = mean_absolute_error(y_test_app, y_pred_app)
    print(f"Appliance Model R2 Score: {r2_app:.4f}, MAE: {mae_app:.2f} kWh")
    
    # ------------------
    # 2. Train Historical Models for Lags 1 to 6
    # ------------------
    temp_map = {1: 24, 2: 26, 3: 30, 4: 34, 5: 36, 6: 32, 7: 29, 8: 28, 9: 28, 10: 30, 11: 27, 12: 24}
    def get_season(m):
        if m in [12, 1, 2]: return "Winter"
        elif m in [3, 4, 5]: return "Summer"
        elif m in [6, 7, 8, 9]: return "Monsoon"
        else: return "PostMonsoon"
        
    days_in_month = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}
    tier_to_category = {
        'Low': 'Residential',
        'Lower-Medium': 'Residential',
        'Medium': 'Residential',
        'High': 'Commercial',
        'Very High': 'Industrial'
    }

    # Save appliance model first
    joblib.dump(app_model, 'appliance_model.pkl')
    joblib.dump(appliance_columns_list, 'appliance_columns.pkl')

    for n_lags in range(1, 7):
        print(f"\n--- Training {n_lags}-month historical model ---")
        df_sorted_lag = df.copy()
        df_sorted_lag['Month_Date'] = pd.to_datetime(df_sorted_lag['Month'], format='%b-%Y')
        df_sorted_lag = df_sorted_lag.sort_values(by=['Consumer ID', 'Month_Date'])
        
        # Create lag features
        lag_cols = []
        for lag in range(1, n_lags + 1):
            df_sorted_lag[f'Units_L{lag}'] = df_sorted_lag.groupby('Consumer ID')['Previous Month Unit (kWh)'].shift(lag - 1)
            df_sorted_lag[f'Amount_L{lag}'] = df_sorted_lag.groupby('Consumer ID')['Previous Bill Amount (Rs)'].shift(lag - 1)
            lag_cols.extend([f'Units_L{lag}', f'Amount_L{lag}'])
            
        df_clean = df_sorted_lag.dropna(subset=lag_cols)
        
        df_features = pd.DataFrame()
        for lag in range(1, n_lags + 1):
            unit_col_name = "Units_30d" if lag == 1 else f"Units_{lag*30}d"
            amt_col_name = "Amount" if lag == 1 else f"Amount_{lag*30}d"
            df_features[unit_col_name] = df_clean[f'Units_L{lag}']
            df_features[amt_col_name] = df_clean[f'Amount_L{lag}']
            
        df_features['Month'] = df_clean['Month_Num']
        df_features['Temp'] = df_clean['Month_Num'].map(temp_map)
        df_features['Billing_Days'] = df_clean['Month_Num'].map(days_in_month)
        
        seasons_lag = df_clean['Month_Num'].map(get_season)
        df_features['Season_PostMonsoon'] = (seasons_lag == "PostMonsoon").astype(int)
        df_features['Season_Summer'] = (seasons_lag == "Summer").astype(int)
        df_features['Season_Winter'] = (seasons_lag == "Winter").astype(int)
        
        df_features['Tariff_Category'] = df_clean['Household Tier'].map(tier_to_category).fillna('Residential')
        df_features = pd.get_dummies(df_features, columns=['Tariff_Category'])
        
        # Make sure all tariff categories exist in the dataframe
        for cat in ['Tariff_Category_Commercial', 'Tariff_Category_Industrial', 'Tariff_Category_Residential']:
            if cat not in df_features.columns:
                df_features[cat] = 0
                
        # Reorder columns to ensure consistency
        feature_cols_list = sorted(list(df_features.columns))
        X_lag = df_features[feature_cols_list]
        y_lag = df_clean[target_col]
        
        X_train_lag, X_test_lag, y_train_lag, y_test_lag = train_test_split(
            X_lag, y_lag, test_size=0.2, random_state=42
        )
        
        model_lag = XGBRegressor(
            n_estimators=150,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )
        model_lag.fit(X_train_lag, y_train_lag)
        
        y_pred_lag = model_lag.predict(X_test_lag)
        r2_lag = r2_score(y_test_lag, y_pred_lag)
        mae_lag = mean_absolute_error(y_test_lag, y_pred_lag)
        print(f"{n_lags}-month Model R2 Score: {r2_lag:.4f}, MAE: {mae_lag:.2f} kWh")
        
        # Save model and feature columns list
        model_file = 'ensemble_model.pkl' if n_lags == 1 else f'ensemble_model_{n_lags}.pkl'
        cols_file = 'feature_columns.pkl' if n_lags == 1 else f'feature_columns_{n_lags}.pkl'
        joblib.dump(model_lag, model_file)
        joblib.dump(feature_cols_list, cols_file)
        
    print("All models trained and saved successfully!")

if __name__ == '__main__':
    main()

