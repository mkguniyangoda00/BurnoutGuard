"""
train.py

Trains and compares Logistic Regression, Random Forest, and XGBoost for
burnout risk classification. Saves the best-performing model + scaler +
metadata (used later by main.py and the admin ModelManagement page).
"""

import os
import json
import joblib
from datetime import datetime

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from xgboost import XGBClassifier

from preprocess import (
    load_dataset, encode_labels, split_and_scale,
    FEATURE_COLUMNS, RISK_LEVELS, MODELS_DIR,
)

os.makedirs(MODELS_DIR, exist_ok=True)


def evaluate(model, X_test, y_test) -> dict:
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    try:
        auc = roc_auc_score(y_test, y_proba, multi_class="ovr")
    except ValueError:
        auc = None

    return {"accuracy": accuracy, "f1Score": f1, "auc": auc}


def main():
    print("Loading dataset...")
    df = load_dataset("dataset.csv")
    df = encode_labels(df)

    X_train, X_test, y_train, y_test, scaler = split_and_scale(df)

    candidates = {
        "LogisticRegression": LogisticRegression(max_iter=1000, multi_class="ovr"),
        "RandomForest": RandomForestClassifier(n_estimators=200, random_state=42),
        "XGBoost": XGBClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.1,
            objective="multi:softprob", num_class=len(RISK_LEVELS),
            eval_metric="mlogloss", random_state=42,
        ),
    }

    results = {}
    trained_models = {}

    for name, model in candidates.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        metrics = evaluate(model, X_test, y_test)
        results[name] = metrics
        trained_models[name] = model
        print(f"  {name}: {metrics}")

    best_name = max(results, key=lambda n: results[n]["f1Score"])
    best_model = trained_models[best_name]
    print(f"\nBest model: {best_name} (F1={results[best_name]['f1Score']:.3f})")

    # Versioning
    existing = [f for f in os.listdir(MODELS_DIR) if f.startswith("model_v")]
    version_num = len(existing) + 1
    version = f"v1.{version_num}-{best_name.lower()}"

    model_file = f"model_{version}.pkl"
    scaler_file = f"scaler_{version}.pkl"

    joblib.dump(best_model, os.path.join(MODELS_DIR, model_file))
    joblib.dump(scaler, os.path.join(MODELS_DIR, scaler_file))

    metadata = {
        "version": version,
        "algorithm": best_name,
        "modelFile": model_file,
        "scalerFile": scaler_file,
        "featureColumns": FEATURE_COLUMNS,
        "riskLevels": RISK_LEVELS,
        "trainedAt": datetime.utcnow().isoformat(),
        "metrics": {k: v for k, v in results.items()},
        "status": "Active",
    }

    with open(os.path.join(MODELS_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nSaved model artifacts to {MODELS_DIR}/ as {version}")


if __name__ == "__main__":
    main()