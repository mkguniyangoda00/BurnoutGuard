"""
leakage_comparison.py

Compares model metrics and top-SHAP features before vs. after removing the
emotionalFatigue -> burnout_score leakage in harmonize_datasets.py. Run this
AFTER regenerating dataset.csv with the fix applied, pointing OLD_METADATA
at a metadata.json backup taken before the fix.

Usage:
    cp models/metadata.json models/metadata_before_fix.json   # before retraining
    python harmonize_datasets.py && python generate_dataset.py && python train.py
    python experiments/leakage_comparison.py
"""

import json
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
OLD_PATH = os.path.join(MODELS_DIR, "metadata_before_fix.json")
NEW_PATH = os.path.join(MODELS_DIR, "metadata.json")
OUT_PATH = os.path.join(os.path.dirname(__file__), "results", "leakage_comparison.md")


def top_features(metadata, n=10):
    return [row["featureName"] for row in metadata.get("globalFeatureImportance", [])[:n]]


def main():
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

    if not os.path.exists(OLD_PATH):
        raise FileNotFoundError(
            f"{OLD_PATH} not found. Copy your pre-fix models/metadata.json to "
            f"models/metadata_before_fix.json BEFORE retraining."
        )

    with open(OLD_PATH) as f:
        before = json.load(f)
    with open(NEW_PATH) as f:
        after = json.load(f)

    before_metrics = before["metrics"][before["algorithm"]]
    after_metrics = after["metrics"][after["algorithm"]]

    lines = [
        "# Leakage Fix — Before vs After Comparison\n",
        "| Metric | Before (leaked) | After (fixed) |",
        "|---|---|---|",
        f"| Algorithm | {before['algorithm']} | {after['algorithm']} |",
        f"| Accuracy | {before_metrics['accuracy']:.4f} | {after_metrics['accuracy']:.4f} |",
        f"| F1 Score | {before_metrics['f1Score']:.4f} | {after_metrics['f1Score']:.4f} |",
        f"| AUC | {before_metrics.get('auc', 'N/A')} | {after_metrics.get('auc', 'N/A')} |",
        "",
        "## Top-10 SHAP Features",
        "| Rank | Before | After |",
        "|---|---|---|",
    ]

    before_top = top_features(before)
    after_top = top_features(after)
    for i in range(10):
        b = before_top[i] if i < len(before_top) else "-"
        a = after_top[i] if i < len(after_top) else "-"
        flag = "  ⚠ moved" if b != a else ""
        lines.append(f"| {i+1} | {b} | {a}{flag} |")

    with open(OUT_PATH, "w") as f:
        f.write("\n".join(lines))

    print(f"Saved comparison to {OUT_PATH}")
    print("\n".join(lines))


if __name__ == "__main__":
    main()