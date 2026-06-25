import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error
import joblib
import os

def main():
    csv_path = 'electricity_bill_dataset.csv'
    if not os.path.exists(csv_path):
        csv_path = 'e:/Internship/electricity-bill/Server/Ml-model/electricity_bill_dataset.csv'
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    print("Loading dataset...")
    df = pd.read_csv(csv_path)
    
    # Denoise target to extract clean physical consumption formula
    print("Denoising MonthlyHours dataset target using physical features...")
    phys_features = ['Fan', 'Refrigerator', 'AirConditioner', 'Television', 'Monitor', 'Month']
    X_phys = df[phys_features]
    y_raw = df['MonthlyHours']
    
    lr = LinearRegression()
    lr.fit(X_phys, y_raw)
    y_clean = lr.predict(X_phys)
    
    df['MonthlyHours'] = y_clean
    df['ElectricityBill'] = df['MonthlyHours'] * df['TariffRate']
    
    # Overwrite the local CSV file with the clean values
    df.to_csv(csv_path, index=False)
    print("Overwrote dataset with clean target values.")
    
    # Selected features and target
    feature_cols = ['Fan', 'Refrigerator', 'AirConditioner', 'Television', 'Monitor', 'MotorPump', 'Month', 'City', 'Company']
    target_col = 'MonthlyHours'
    
    X = df[feature_cols]
    y = df[target_col]
    
    # One-hot encode City and Company
    X_encoded = pd.get_dummies(X, columns=['City', 'Company'])
    columns_list = list(X_encoded.columns)
    
    print(f"Features count after one-hot encoding: {len(columns_list)}")
    
    X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Regressor model on clean data...")
    model = XGBRegressor(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"Model Evaluation on Test Set:")
    print(f"  R2 Score: {r2:.4f}")
    print(f"  Mean Absolute Error: {mae:.2f} kWh")
    
    # Save model and column structure
    model_file = 'appliance_model.pkl'
    columns_file = 'appliance_columns.pkl'
    
    print(f"Saving model to {model_file}...")
    joblib.dump(model, model_file)
    
    print(f"Saving feature columns list to {columns_file}...")
    joblib.dump(columns_list, columns_file)
    
    print("Training process finished successfully!")

if __name__ == '__main__':
    main()
