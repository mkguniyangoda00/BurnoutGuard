"""
preprocess.py

Shared preprocessing utilities used by train.py, explain.py, and main.py.
FEATURE_COLUMNS defines the exact feature order the model expects — this
list MUST stay in sync with backend/src/utils/FeatureAggregator.ts.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib
import os

FEATURE_COLUMNS = [
    "sleepHours", "sleepQuality", "exerciseLevel", "screenTimeHours",
    "workHours", "workloadRating", "overtimeHours", "breaksTaken",
    "commuteMinutes", "stressLevel", "moodScore", "energyLevel",
    "workSatisfaction", "caffeineIntake", "mealQuality", "socialSupportLevel",
    "anxietyLevel", "emotionalFatigue", "motivationLevel",
    "concentrationIssues", "irritabilityLevel", "lonelinessLevel",
    "selfEfficacy", "copingAbility", "powerInternetDisruption",
    "wfhEnvironmentQuality", "familyResponsibilityLoad",
    "salaryWorkloadSatisfaction", "afterHoursMessaging",
    # Work Pattern Monitoring (new)
    "meetingsCount", "urgentTasksCount", "sprintPressureRating",
    "deadlineFrequency", "isWeekendWork", "bugFixingLoad",
    "contextSwitchingFrequency", "isOnCallToday", "workModeEncoded",
]

RISK_LEVELS = ["Low", "Moderate", "High", "Critical"]
RISK_TO_INT = {level: i for i, level in enumerate(RISK_LEVELS)}
INT_TO_RISK = {i: level for level, i in RISK_TO_INT.items()}

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def load_dataset(path: str = "dataset.csv") -> pd.DataFrame:
    df = pd.read_csv(path)
    return clean(df)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Missing expected column: {col}")
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())
    if "afterHoursMessaging" in df.columns:
        df["afterHoursMessaging"] = df["afterHoursMessaging"].astype(int)
    return df


def encode_labels(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["riskLabel"] = df["riskLevel"].map(RISK_TO_INT)
    return df


def split_and_scale(df: pd.DataFrame):
    from sklearn.model_selection import train_test_split

    X = df[FEATURE_COLUMNS]
    y = df["riskLabel"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, y_train, y_test, scaler


def build_feature_vector(raw_features: dict) -> pd.DataFrame:
    """
    Takes a dict of {featureName: value} (as sent by the backend) and returns
    a single-row DataFrame in the exact FEATURE_COLUMNS order, filling any
    missing values with a neutral midpoint default.
    """
    row = {}
    for col in FEATURE_COLUMNS:
        if col in raw_features and raw_features[col] is not None:
            row[col] = float(raw_features[col])
        else:
            row[col] = 3.0  # neutral fallback if a feature is missing
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def load_latest_artifacts():
    """Loads the most recently trained model, scaler, and metadata."""
    metadata_path = os.path.join(MODELS_DIR, "metadata.json")
    if not os.path.exists(metadata_path):
        return None

    import json
    with open(metadata_path) as f:
        metadata = json.load(f)

    model_path = os.path.join(MODELS_DIR, metadata["modelFile"])
    scaler_path = os.path.join(MODELS_DIR, metadata["scalerFile"])

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    return {"model": model, "scaler": scaler, "metadata": metadata}