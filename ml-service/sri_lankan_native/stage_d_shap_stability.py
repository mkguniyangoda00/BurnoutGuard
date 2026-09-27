"""
Stage D: SHAP stability check for the selected LogisticRegression model.

For each of 3 seeds (42, 43, 44), a bootstrap resample of the 311-row
training data is drawn, the preprocessing pipeline (median-impute + scale,
fit only on that resample) and LogisticRegression are fit on it, and SHAP
values are computed on a fixed evaluation sample so importances are
comparable across seeds. Global importance per feature = mean(|SHAP value|)
averaged across the 4 classes and evaluation rows. Reports the top-10 features
per seed and their appearance-rate consistency across the 3 seeds.

Hyperparameter: C is fixed at 0.01 (the modal value selected by the nested
inner-CV grid search across Stage B's 15 outer folds -- see
results_candidates.json selectedParamsPerFold) rather than re-run inside
each bootstrap, since the point of this check is SHAP stability under
resampling, not hyperparameter selection.

Does not touch anything under ../experiments/global_to_local_generalization/.
"""

import json
import warnings

import numpy as np
import pandas as pd
import shap
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from evaluate_model import load_data

warnings.filterwarnings("ignore")

RESULTS_PATH = "results_shap_stability.json"
SEEDS = [42, 43, 44]
FIXED_C = 0.01
N_EVAL_ROWS = 100
TOP_N = 10

OBJECTIVE_CLUSTER = {
    "working_hours_per_day",
    "overtime_hours_per_week",
    "urgent_tasks_per_week",
    "breaks_per_workday",
    "exercise_days_per_week",
    "caffeinated_drinks_per_day",
    "commute_time_minutes",
}


def fit_on_bootstrap(X, y, seed):
    rng = np.random.RandomState(seed)
    idx = rng.randint(0, len(X), size=len(X))
    X_boot, y_boot = X.iloc[idx].reset_index(drop=True), y.iloc[idx].reset_index(drop=True)

    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()
    X_boot_imputed = imputer.fit_transform(X_boot)
    X_boot_scaled = scaler.fit_transform(X_boot_imputed)

    model = LogisticRegression(
        C=FIXED_C, penalty="l2", solver="lbfgs", max_iter=2000, random_state=seed
    )
    model.fit(X_boot_scaled, y_boot)
    return model, imputer, scaler


def compute_shap_importance(model, imputer, scaler, X_eval, feature_names):
    X_eval_scaled = scaler.transform(imputer.transform(X_eval))
    background = shap.sample(X_eval_scaled, 50, random_state=0)

    explainer = shap.Explainer(model.predict_proba, background, feature_names=feature_names)
    shap_values = explainer(X_eval_scaled)

    # shap_values.values shape: (n_rows, n_features, n_classes) for multiclass predict_proba
    abs_vals = np.abs(shap_values.values)
    mean_abs_per_feature = abs_vals.mean(axis=(0, 2))  # average over rows and classes
    return dict(zip(feature_names, mean_abs_per_feature.tolist()))


def main():
    X, y = load_data()
    feature_names = list(X.columns)

    rng_eval = np.random.RandomState(123)
    eval_idx = rng_eval.choice(len(X), size=min(N_EVAL_ROWS, len(X)), replace=False)
    X_eval = X.iloc[eval_idx].reset_index(drop=True)
    print(f"Fixed evaluation sample: {len(X_eval)} rows (same across all seeds).")
    print(f"Fixed C={FIXED_C} (modal value from Stage B's nested grid search).")
    print()

    per_seed_top10 = {}
    per_seed_full_importance = {}

    for seed in SEEDS:
        print(f"Seed {seed}: fitting on bootstrap resample, computing SHAP...")
        model, imputer, scaler = fit_on_bootstrap(X, y, seed)
        importance = compute_shap_importance(model, imputer, scaler, X_eval, feature_names)
        ranked = sorted(importance.items(), key=lambda kv: kv[1], reverse=True)
        top10 = ranked[:TOP_N]
        per_seed_top10[seed] = top10
        per_seed_full_importance[seed] = importance

        print(f"  Top {TOP_N} for seed {seed}:")
        for rank, (feat, val) in enumerate(top10, start=1):
            flag = " [OBJECTIVE CLUSTER]" if feat in OBJECTIVE_CLUSTER else ""
            print(f"    {rank:2d}. {feat:35s} {val:.4f}{flag}")
        print()

    all_top10_features = [set(f for f, _ in per_seed_top10[s]) for s in SEEDS]
    feature_appearance_count = {}
    for feat_set in all_top10_features:
        for feat in feat_set:
            feature_appearance_count[feat] = feature_appearance_count.get(feat, 0) + 1

    consistent_all_3 = sorted(
        [f for f, c in feature_appearance_count.items() if c == 3]
    )
    appeared_2 = sorted([f for f, c in feature_appearance_count.items() if c == 2])
    appeared_1 = sorted([f for f, c in feature_appearance_count.items() if c == 1])

    print(f"Appeared in top-{TOP_N} across all 3 seeds ({len(consistent_all_3)}):")
    for f in consistent_all_3:
        flag = " [OBJECTIVE CLUSTER]" if f in OBJECTIVE_CLUSTER else ""
        print(f"  {f}{flag}")
    print(f"Appeared in exactly 2/3 seeds ({len(appeared_2)}):")
    for f in appeared_2:
        flag = " [OBJECTIVE CLUSTER]" if f in OBJECTIVE_CLUSTER else ""
        print(f"  {f}{flag}")
    print(f"Appeared in exactly 1/3 seeds ({len(appeared_1)}):")
    for f in appeared_1:
        flag = " [OBJECTIVE CLUSTER]" if f in OBJECTIVE_CLUSTER else ""
        print(f"  {f}{flag}")
    print()

    cluster_in_consistent = [f for f in consistent_all_3 if f in OBJECTIVE_CLUSTER]
    cluster_anywhere_top10 = sorted(
        set(f for s in SEEDS for f, _ in per_seed_top10[s] if f in OBJECTIVE_CLUSTER)
    )
    print(f"Objective-cluster features appearing in ANY seed's top-{TOP_N}: "
          f"{len(cluster_anywhere_top10)}/7 -> {cluster_anywhere_top10}")
    print(f"Objective-cluster features consistent across all 3 seeds: "
          f"{len(cluster_in_consistent)} -> {cluster_in_consistent}")

    collinearity_caveat = (
        f"{len(cluster_anywhere_top10)} of the 7 known-collinear 'objective' features "
        f"(pairwise |r|=0.6-0.74, see earlier correlation check) appear in at least one "
        f"seed's top-{TOP_N} SHAP ranking: {cluster_anywhere_top10}. "
        f"{len(cluster_in_consistent)} of them are consistent across all 3 seeds: "
        f"{cluster_in_consistent}. Because these features are highly intercorrelated, "
        "SHAP can arbitrarily split or shift credit among them depending on which exact "
        "bootstrap resample and feature ordering the explainer encounters -- a feature's "
        "presence, absence, or rank within this cluster should not be read as evidence "
        "that it specifically (rather than the correlated cluster as a whole) drives "
        "predictions. Interpret this cluster's SHAP contribution collectively, not "
        "feature-by-feature."
    )
    print()
    print(collinearity_caveat)

    results = {
        "stage": "D_shap_stability",
        "model": "LogisticRegression",
        "fixedC": FIXED_C,
        "cCcSelectionNote": (
            "C fixed at 0.01, the modal value selected by nested inner-CV grid search "
            "across Stage B's 15 outer folds (see results_candidates.json "
            "selectedParamsPerFold), rather than re-tuned per bootstrap resample."
        ),
        "seeds": SEEDS,
        "nEvalRows": len(X_eval),
        "evalRowSelection": "Fixed random sample of 100 rows (seed=123), same set used for all 3 seeds so importances are comparable.",
        "topNReported": TOP_N,
        "perSeedTop10": {
            str(seed): [{"feature": f, "meanAbsShap": v} for f, v in per_seed_top10[seed]]
            for seed in SEEDS
        },
        "perSeedFullImportance": {
            str(seed): per_seed_full_importance[seed] for seed in SEEDS
        },
        "consistencyAcrossSeeds": {
            "appearedInAllThreeSeeds": consistent_all_3,
            "appearedInExactlyTwoSeeds": appeared_2,
            "appearedInExactlyOneSeed": appeared_1,
        },
        "objectiveClusterFeatures": sorted(OBJECTIVE_CLUSTER),
        "objectiveClusterFindings": {
            "appearingInAnySeedTop10": cluster_anywhere_top10,
            "consistentAcrossAllThreeSeeds": cluster_in_consistent,
            "collinearityCaveat": collinearity_caveat,
        },
    }

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print()
    print(f"Saved results to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
