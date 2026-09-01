"""
shap_stability.py

Trains the winning model architecture N times with different random seeds
and/or bootstrap resamples, then measures how stable the top SHAP feature
rankings are across runs. Produces:
  - experiments/results/shap_stability.json  (raw per-run rankings)
  - experiments/results/shap_stability_summary.md (overlap + correlation stats)
"""

import json
import os
from itertools import combinations

import numpy as np
from scipy.stats import spearmanr
from sklearn.base import clone
from sklearn.pipeline import Pipeline

from explain import compute_pipeline_shap_results
from preprocess import FEATURE_COLUMNS, encode_labels
from train import SOURCE_TARGET, build_preprocessing_pipeline
import joblib

N_RUNS = 20
TOP_K = 10

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)


def run_once(seed: int, X, y, pipeline):

    rng = np.random.RandomState(seed)
    idx = rng.choice(len(X), size=len(X), replace=True)
    X_boot = X.iloc[idx]
    y_boot = y.iloc[idx]

    fitted = clone(pipeline)
    fitted.fit(X_boot, y_boot)
    importance = compute_pipeline_shap_results(fitted, X.iloc[:200], local_rows=1)
    return importance["featureRanking"]


def jaccard(a: list, b: list) -> float:
    set_a, set_b = set(a), set(b)
    if not set_a and not set_b:
        return 1.0
    return len(set_a & set_b) / len(set_a | set_b)


def main():
    print("Loading dataset...")
    df = encode_labels(pd.read_csv("dataset.csv", low_memory=False))
    df = df[df["source_dataset"].astype(str).str.lower() != SOURCE_TARGET.lower()].copy()
    X_train = df[FEATURE_COLUMNS]
    y_train = df["riskLabel"]
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    with open(os.path.join(models_dir, "metadata.json"), encoding="utf-8") as metadata_file:
        metadata = json.load(metadata_file)
    pipeline = Pipeline([
        ("preprocessing", joblib.load(os.path.join(models_dir, metadata["scalerFile"]))),
        ("model", joblib.load(os.path.join(models_dir, metadata["modelFile"]))),
    ])

    all_rankings = []
    for i in range(N_RUNS):
        print(f"Run {i + 1}/{N_RUNS}...")
        ranking = run_once(seed=i, X=X_train, y=y_train, pipeline=pipeline)
        all_rankings.append(ranking)

    with open(os.path.join(RESULTS_DIR, "shap_stability.json"), "w", encoding="utf-8") as f:
        json.dump({"runs": all_rankings, "topK": TOP_K}, f, indent=2)

    top_k_lists = [r[:TOP_K] for r in all_rankings]
    jaccard_scores = [jaccard(a, b) for a, b in combinations(top_k_lists, 2)]

    rank_maps = [{feat: rank for rank, feat in enumerate(r)} for r in all_rankings]
    spearman_scores = []
    for a, b in combinations(rank_maps, 2):
        common = [f for f in FEATURE_COLUMNS if f in a and f in b]
        ranks_a = [a[f] for f in common]
        ranks_b = [b[f] for f in common]
        if len(common) > 1:
            corr, _ = spearmanr(ranks_a, ranks_b)
            spearman_scores.append(corr)

    from collections import Counter

    appearance_counts = Counter()
    for r in top_k_lists:
        for feat in r:
            appearance_counts[feat] += 1

    stable_features = [(feat, count / N_RUNS) for feat, count in appearance_counts.most_common()]

    summary_lines = [
        "# SHAP Stability Evaluation",
        "",
        f"Runs: {N_RUNS}, Top-K: {TOP_K}",
        f"Mean pairwise top-{TOP_K} Jaccard overlap: {np.mean(jaccard_scores):.3f} "
        f"(std {np.std(jaccard_scores):.3f})",
        f"Mean pairwise Spearman rank correlation: {np.mean(spearman_scores):.3f} "
        f"(std {np.std(spearman_scores):.3f})",
        "",
        f"## Feature appearance rate in top-{TOP_K} across {N_RUNS} runs",
        "| Feature | Appearance rate |",
        "|---|---|",
    ]
    for feat, rate in stable_features:
        summary_lines.append(f"| {feat} | {rate * 100:.0f}% |")

    summary_path = os.path.join(RESULTS_DIR, "shap_stability_summary.md")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("\n".join(summary_lines))

    print(f"\nSaved summary to {summary_path}")
    print(f"Mean top-{TOP_K} Jaccard overlap: {np.mean(jaccard_scores):.3f}")
    print(f"Mean Spearman correlation: {np.mean(spearman_scores):.3f}")


if __name__ == "__main__":
    main()
