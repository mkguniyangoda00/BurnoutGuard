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

from explain import compute_global_feature_importance
from preprocess import FEATURE_COLUMNS, encode_labels, load_dataset, split_and_scale
from train import fit_best_model, get_model_candidates

N_RUNS = 20
TOP_K = 10

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)


def build_fixed_model(name: str, params: dict):
    candidates = get_model_candidates()
    model = candidates[name][0]
    model.set_params(**params)
    return model


def run_once(seed: int, df, model_name: str, model_params: dict):
    df_encoded = encode_labels(df)
    X_train, X_test, y_train, y_test, scaler = split_and_scale(df_encoded)

    rng = np.random.RandomState(seed)
    idx = rng.choice(len(X_train), size=len(X_train), replace=True)
    X_boot = X_train[idx]
    y_boot = y_train.iloc[idx] if hasattr(y_train, "iloc") else y_train[idx]

    model = build_fixed_model(model_name, model_params)
    model.fit(X_boot, y_boot)

    background = X_train[:100] if len(X_train) >= 100 else X_train
    importance = compute_global_feature_importance(
        model,
        X_train[:200] if len(X_train) >= 200 else X_train,
        background,
    )
    return [row["featureName"] for row in importance]


def jaccard(a: list, b: list) -> float:
    set_a, set_b = set(a), set(b)
    if not set_a and not set_b:
        return 1.0
    return len(set_a & set_b) / len(set_a | set_b)


def main():
    print("Loading dataset...")
    df = load_dataset("dataset.csv")

    df_encoded = encode_labels(df)
    X_train, X_test, y_train, y_test, _ = split_and_scale(df_encoded)
    _, _, selected_results = fit_best_model(X_train, y_train)
    best_name = max(selected_results, key=lambda n: selected_results[n]["cvBestScore"])
    best_params = selected_results[best_name]["bestParams"]

    all_rankings = []
    for i in range(N_RUNS):
        print(f"Run {i + 1}/{N_RUNS}...")
        ranking = run_once(seed=i, df=df, model_name=best_name, model_params=best_params)
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
