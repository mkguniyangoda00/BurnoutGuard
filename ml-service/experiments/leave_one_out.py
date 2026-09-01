"""
leave_one_out.py

Leave-one-feature-out sensitivity analysis for the five features that were
most directly involved in the old synthetic label construction:
  - stressLevel
  - emotionalFatigue
  - workHours
  - overtimeHours
  - sleepHours

The experiment follows the corrected dataset and the project's existing
evaluation conventions:
  - uses riskLabel from the harmonized_risk_norm -> quartile pipeline
  - uses the same source-aware split as train.py
  - uses the same model-selection routine as train.py
  - reports standard multiclass metrics plus F1 drop vs baseline
"""

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from preprocess import FEATURE_COLUMNS, RISK_LEVELS, encode_labels, load_dataset, source_split
from train import fit_best_model

BASE_FEATURES = [
    "stressLevel",
    "emotionalFatigue",
    "workHours",
    "overtimeHours",
    "sleepHours",
]

RESULTS_DIR = Path(__file__).resolve().parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

DATASET_PATH = Path(__file__).resolve().parents[1] / "dataset.csv"
SOURCE_TARGET = "sri_lankan_developer_burnout"


def evaluate(model, X, y):
    y_pred = model.predict(X)
    precision, recall, f1, support = precision_recall_fscore_support(
        y,
        y_pred,
        labels=list(range(len(RISK_LEVELS))),
        zero_division=0,
    )
    return {
        "accuracy": float(accuracy_score(y, y_pred)),
        "weightedF1": float(f1_score(y, y_pred, average="weighted")),
        "macroF1": float(f1_score(y, y_pred, average="macro")),
        "macroPrecision": float(np.mean(precision)),
        "macroRecall": float(np.mean(recall)),
        "precisionPerClass": [float(x) for x in precision],
        "recallPerClass": [float(x) for x in recall],
        "f1PerClass": [float(x) for x in f1],
        "supportPerClass": [int(x) for x in support],
    }


def train_eval(feature_subset, train_df, val_df):
    X_train = train_df[feature_subset]
    y_train = train_df["riskLabel"]
    X_val = val_df[feature_subset]
    y_val = val_df["riskLabel"]

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    best_name, best_model, _ = fit_best_model(X_train_scaled, y_train, X_val_scaled, y_val)
    metrics = evaluate(best_model, X_val_scaled, y_val)
    metrics["algorithm"] = best_name
    return metrics


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"{DATASET_PATH} not found. Run `python generate_dataset.py` first."
        )

    df = encode_labels(load_dataset(str(DATASET_PATH)))
    source_train, _ = source_split(df, SOURCE_TARGET)

    train_df, val_df = train_test_split(
        source_train,
        test_size=0.2,
        random_state=42,
        stratify=source_train["riskLabel"],
    )

    baseline_features = FEATURE_COLUMNS
    results = {}

    print("Training baseline model...")
    results["baseline"] = train_eval(baseline_features, train_df, val_df)
    baseline_f1 = results["baseline"]["weightedF1"]
    results["baseline"]["f1Drop"] = 0.0
    results["baseline"]["f1DropPct"] = 0.0

    for excluded in BASE_FEATURES:
        subset = [feat for feat in FEATURE_COLUMNS if feat != excluded]
        print(f"Training leave-one-out model excluding {excluded}...")
        metrics = train_eval(subset, train_df, val_df)
        metrics["excludedFeature"] = excluded
        metrics["f1Drop"] = float(baseline_f1 - metrics["weightedF1"])
        metrics["f1DropPct"] = float((metrics["f1Drop"] / baseline_f1) * 100) if baseline_f1 else 0.0
        results[excluded] = metrics

    payload = {
        "baseline": results["baseline"],
        "experiments": {
            feature: {
                "accuracy": results[feature]["accuracy"],
                "weightedF1": results[feature]["weightedF1"],
                "macroF1": results[feature]["macroF1"],
                "macroPrecision": results[feature]["macroPrecision"],
                "macroRecall": results[feature]["macroRecall"],
                "precisionPerClass": results[feature]["precisionPerClass"],
                "recallPerClass": results[feature]["recallPerClass"],
                "f1PerClass": results[feature]["f1PerClass"],
                "supportPerClass": results[feature]["supportPerClass"],
                "f1Drop": results[feature]["f1Drop"],
                "f1DropPct": results[feature]["f1DropPct"],
            }
            for feature in BASE_FEATURES
        },
        "settings": {
            "splitRandomState": 42,
            "testSize": 0.2,
            "holdoutSource": SOURCE_TARGET,
            "target": "riskLabel",
            "baselineFeatures": baseline_features,
        },
    }

    json_path = RESULTS_DIR / "leave_one_out.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    rows = [
        "| Excluded feature | Weighted F1 | F1 drop | F1 drop (%) |",
        "| ---------------- | ----------: | ------: | ----------: |",
    ]
    rows.append(
        f"| Baseline | {baseline_f1:.4f} | 0.0000 | 0.00 |"
    )
    for feature in BASE_FEATURES:
        metrics = results[feature]
        rows.append(
            f"| {feature} | {metrics['weightedF1']:.4f} | {metrics['f1Drop']:.4f} | {metrics['f1DropPct']:.2f} |"
        )

    biggest = max(BASE_FEATURES, key=lambda f: results[f]["f1Drop"])
    summary = [
        "# Leave-One-Out Sensitivity Analysis",
        "",
        f"Baseline weighted F1: {baseline_f1:.4f}",
        "",
        "\n".join(rows),
        "",
        f"Most sensitive feature: {biggest} ({results[biggest]['f1Drop']:.4f} absolute F1 drop, {results[biggest]['f1DropPct']:.2f}%)",
        "",
        "Interpretation: removing a feature with a larger weighted-F1 drop indicates that the corrected model still relies on that signal, but not as a label shortcut. The target is now derived only from harmonized_risk_norm, so sensitivity here reflects predictive utility rather than leakage.",
    ]

    md_path = RESULTS_DIR / "leave_one_out_summary.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(summary))

    print(f"Saved results to {json_path}")
    print(f"Saved summary to {md_path}")
    print(f"Baseline weighted F1: {baseline_f1:.4f}")
    for feature in BASE_FEATURES:
        print(
            f"Excluded {feature}: weighted F1={results[feature]['weightedF1']:.4f}, "
            f"drop={results[feature]['f1Drop']:.4f}, drop%={results[feature]['f1DropPct']:.2f}"
        )


if __name__ == "__main__":
    main()
