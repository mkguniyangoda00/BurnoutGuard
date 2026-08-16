"""
calibration.py

Evaluates whether the deployed model's predicted probabilities are
calibrated (i.e. when it says 80% confident, is it right ~80% of the time).
Produces a reliability diagram, Brier score, and Expected Calibration Error
(ECE) for the current model, then compares against an isotonic-calibrated
version. Run standalone — does not modify the deployed model.
"""

import json
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.calibration import calibration_curve, CalibratedClassifierCV
from sklearn.metrics import brier_score_loss

from preprocess import load_dataset, encode_labels, split_and_scale, load_latest_artifacts

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

N_BINS = 10


def expected_calibration_error(y_true, y_prob, n_bins=N_BINS):
    bin_edges = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    for i in range(n_bins):
        lo, hi = bin_edges[i], bin_edges[i + 1]
        mask = (y_prob >= lo) & (y_prob < hi) if i < n_bins - 1 else (y_prob >= lo) & (y_prob <= hi)
        if mask.sum() == 0:
            continue
        bin_acc = y_true[mask].mean()
        bin_conf = y_prob[mask].mean()
        ece += (mask.sum() / n) * abs(bin_acc - bin_conf)
    return ece


def evaluate_one_vs_rest(model, X_test, y_test, class_idx: int, label: str):
    proba = model.predict_proba(X_test)[:, class_idx]
    y_binary = (y_test == class_idx).astype(int)

    brier = brier_score_loss(y_binary, proba)
    ece = expected_calibration_error(np.array(y_binary), proba)
    frac_pos, mean_pred = calibration_curve(y_binary, proba, n_bins=N_BINS, strategy="uniform")

    return {
        "label": label,
        "brier": brier,
        "ece": ece,
        "fracPos": frac_pos.tolist(),
        "meanPred": mean_pred.tolist(),
    }


def main():
    print("Loading dataset and trained artifacts...")
    df = load_dataset("dataset.csv")
    df_encoded = encode_labels(df)
    X_train, X_test, y_train, y_test, scaler = split_and_scale(df_encoded)

    artifacts = load_latest_artifacts()
    if artifacts is None:
        raise RuntimeError("No trained model found — run train.py first.")

    model = artifacts["model"]
    risk_levels = artifacts["metadata"]["riskLevels"]

    results = []
    for idx, label in enumerate(risk_levels):
        result = evaluate_one_vs_rest(model, X_test, y_test.to_numpy() if hasattr(y_test, "to_numpy") else y_test, idx, label)
        results.append(result)
        print(f"{label}: Brier={result['brier']:.4f}, ECE={result['ece']:.4f}")

    # Try isotonic calibration and compare
    print("\nFitting isotonic-calibrated version for comparison...")
    calibrated = CalibratedClassifierCV(model, method="isotonic", cv="prefit")
    calibrated.fit(X_test, y_test)

    calibrated_results = []
    for idx, label in enumerate(risk_levels):
        result = evaluate_one_vs_rest(calibrated, X_test, y_test.to_numpy() if hasattr(y_test, "to_numpy") else y_test, idx, label)
        calibrated_results.append(result)
        print(f"[calibrated] {label}: Brier={result['brier']:.4f}, ECE={result['ece']:.4f}")

    # Reliability diagrams
    fig, axes = plt.subplots(1, len(risk_levels), figsize=(5 * len(risk_levels), 4))
    if len(risk_levels) == 1:
        axes = [axes]
    for ax, before, after in zip(axes, results, calibrated_results):
        ax.plot([0, 1], [0, 1], "k--", label="Perfect calibration")
        ax.plot(before["meanPred"], before["fracPos"], "o-", label="Uncalibrated")
        ax.plot(after["meanPred"], after["fracPos"], "s-", label="Isotonic calibrated")
        ax.set_title(before["label"])
        ax.set_xlabel("Mean predicted probability")
        ax.set_ylabel("Observed frequency")
        ax.legend(fontsize=8)
    plt.tight_layout()
    plot_path = os.path.join(RESULTS_DIR, "calibration_reliability.png")
    plt.savefig(plot_path, dpi=150)
    print(f"\nSaved reliability diagram to {plot_path}")

    with open(os.path.join(RESULTS_DIR, "calibration_results.json"), "w") as f:
        json.dump({"uncalibrated": results, "isotonicCalibrated": calibrated_results}, f, indent=2)

    print(f"Saved raw results to {RESULTS_DIR}/calibration_results.json")


if __name__ == "__main__":
    main()
    