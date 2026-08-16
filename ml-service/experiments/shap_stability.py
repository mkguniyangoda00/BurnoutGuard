"""
shap_stability.py

Trains the winning model architecture N times with different random seeds
and/or bootstrap resamples, then measures how stable the top SHAP feature
rankings are across runs. Produces:
  - experiments/results/shap_stability.json  (raw per-run rankings)
  - experiments/results/shap_stability_summary.md (overlap + correlation stats)

Run standalone, separate from the production train.py — does not overwrite
any deployed model artifacts.
"""

import json
import os
import numpy as np
from itertools import combinations
from scipy.stats import spearmanr

from preprocess import load_dataset, encode_labels, split_and_scale, FEATURE_COLUMNS
from explain import compute_global_feature_importance

N_RUNS = 20
TOP_K = 10

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)


def get_model(seed: int):
    """Winning architecture per metadata.json — swap this if your best
    algorithm changes after the leakage fix retrain."""
    from sklearn.linear_model import LogisticRegression
    return LogisticRegression(max_iter=1000, random_state=seed)


def run_once(seed: int, df):
    df_encoded = encode_labels(df)
    X_train, X_test, y_train, y_test, scaler = split_and_scale(df_encoded)

    # Bootstrap resample the training set for this run (in addition to the
    # differing random_state) so we're testing both model-seed variance and
    # sampling variance, not just seed variance alone.
    rng = np.random.RandomState(seed)
    idx = rng.choice(len(X_train), size=len(X_train), replace=True)
    X_boot, y_boot = X_train[idx], y_train.iloc[idx] if hasattr(y_train, "iloc") else y_train[idx]

    model = get_model(seed)
    model.fit(X_boot, y_boot)

    background = X_train[:100] if len(X_train) >= 100 else X_train
    importance = compute_global_feature_importance(
        model, X_train[:200] if len(X_train) >= 200 else X_train, background
    )
    ranked_features = [row["featureName"] for row in importance]
    return ranked_features


def jaccard(a: list, b: list) -> float:
    set_a, set_b = set(a), set(b)
    if not set_a and not set_b:
        return 1.0
    return len(set_a & set_b) / len(set_a | set_b)


def main():
    print("Loading dataset...")
    df = load_dataset("dataset.csv")

    all_rankings = []
    for i in range(N_RUNS):
        print(f"Run {i + 1}/{N_RUNS}...")
        ranking = run_once(seed=i, df=df)
        all_rankings.append(ranking)

    with open(os.path.join(RESULTS_DIR, "shap_stability.json"), "w") as f:
        json.dump({"runs": all_rankings, "topK": TOP_K}, f, indent=2)

    # Pairwise top-K Jaccard overlap
    top_k_lists = [r[:TOP_K] for r in all_rankings]
    jaccard_scores = [
        jaccard(a, b) for a, b in combinations(top_k_lists, 2)
    ]

    # Pairwise Spearman rank correlation over the full feature list
    rank_maps = [
        {feat: rank for rank, feat in enumerate(r)} for r in all_rankings
    ]
    spearman_scores = []
    for a, b in combinations(rank_maps, 2):
        common = [f for f in FEATURE_COLUMNS if f in a and f in b]
        ranks_a = [a[f] for f in common]
        ranks_b = [b[f] for f in common]
        if len(common) > 1:
            corr, _ = spearmanr(ranks_a, ranks_b)
            spearman_scores.append(corr)

    # Per-feature: how often does it appear in the top-K?
    from collections import Counter
    appearance_counts = Counter()
    for r in top_k_lists:
        for feat in r:
            appearance_counts[feat] += 1

    stable_features = [
        (feat, count / N_RUNS) for feat, count in appearance_counts.most_common()
    ]

    summary_lines = [
        "# SHAP Stability Evaluation\n",
        f"Runs: {N_RUNS}, Top-K: {TOP_K}\n",
        f"Mean pairwise top-{TOP_K} Jaccard overlap: {np.mean(jaccard_scores):.3f} "
        f"(std {np.std(jaccard_scores):.3f})",
        f"Mean pairwise Spearman rank correlation: {np.mean(spearman_scores):.3f} "
        f"(std {np.std(spearman_scores):.3f})\n",
        "## Feature appearance rate in top-{} across {} runs".format(TOP_K, N_RUNS),
        "| Feature | Appearance rate |",
        "|---|---|",
    ]
    for feat, rate in stable_features:
        summary_lines.append(f"| {feat} | {rate * 100:.0f}% |")

    summary_path = os.path.join(RESULTS_DIR, "shap_stability_summary.md")
    with open(summary_path, "w") as f:
        f.write("\n".join(summary_lines))

    print(f"\nSaved summary to {summary_path}")
    print(f"Mean top-{TOP_K} Jaccard overlap: {np.mean(jaccard_scores):.3f}")
    print(f"Mean Spearman correlation: {np.mean(spearman_scores):.3f}")


if __name__ == "__main__":
    main()