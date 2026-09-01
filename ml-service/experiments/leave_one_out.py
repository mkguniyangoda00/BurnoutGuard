"""
Leave-one-feature-out sensitivity analysis.

Every predictor is removed exactly once and evaluated with the same repeated
5-fold, 3-repeat CV and fold-contained preprocessing used by train.py. This
is sensitivity analysis, not model optimization. Sri Lankan external rows
are excluded before any model fitting and are never used for feature choice.
"""

import json
import os
import sys
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from preprocess import FEATURE_COLUMNS, encode_labels
from train import SOURCE_TARGET, cross_validate_model, get_model_candidates

RESULTS_DIR = Path(__file__).resolve().parents[1] / "models"
DATASET_PATH = Path(__file__).resolve().parents[1] / "dataset.csv"


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"{DATASET_PATH} not found. Run `python generate_dataset.py` first."
        )

    df = encode_labels(pd.read_csv(DATASET_PATH, low_memory=False))
    development = df[
        df["source_dataset"].astype(str).str.lower() != SOURCE_TARGET.lower()
    ].copy()
    X = development[FEATURE_COLUMNS]
    y = development["riskLabel"]

    candidates = get_model_candidates()
    model_name = json.load(open(RESULTS_DIR / "metadata.json", encoding="utf-8"))["algorithm"]
    model = candidates[model_name][0]
    params = candidates[model_name][1]
    for parameter, values in params.items():
        model.set_params(**{parameter: values[0]})

    baseline = cross_validate_model(model, X, y)
    experiments = []
    for excluded_feature in FEATURE_COLUMNS:
        subset = [feature for feature in FEATURE_COLUMNS if feature != excluded_feature]
        metrics = cross_validate_model(model, X[subset], y, subset)
        experiments.append({
            "excludedFeature": excluded_feature,
            "baseline_macroF1": baseline["macroF1"],
            "leave_one_out_macroF1": metrics["macroF1"],
            "delta_macroF1": {
                "mean": metrics["macroF1"]["mean"] - baseline["macroF1"]["mean"],
                "std": metrics["macroF1"]["std"],
                "foldScores": [
                    after - before
                    for before, after in zip(
                        baseline["macroF1"]["foldScores"],
                        metrics["macroF1"]["foldScores"],
                    )
                ],
            },
        })
        print(f"Completed exclusion: {excluded_feature}")

    experiments.sort(key=lambda item: abs(item["delta_macroF1"]["mean"]), reverse=True)
    payload = {
        "model": model_name,
        "target": "riskLabel derived from harmonized_risk_norm",
        "excludedSource": SOURCE_TARGET,
        "cv": {"nSplits": 5, "nRepeats": 3, "randomState": 42},
        "sensitivityAnalysis": "not model optimization",
        "baseline": baseline,
        "experiments": experiments,
    }
    json_path = RESULTS_DIR / "leave_one_out_results.json"
    with open(json_path, "w", encoding="utf-8") as output_file:
        json.dump(payload, output_file, indent=2)

    print("\nLeave-one-out sensitivity summary (sorted by absolute macro F1 change):")
    for item in experiments:
        delta = item["delta_macroF1"]["mean"]
        print(f"{item['excludedFeature']:<32} delta_macroF1={delta:+.4f}")
    print(f"Saved results to {json_path}")


if __name__ == "__main__":
    main()
