"""
Sri Lankan-only model evaluation.

Reads sri_lankan_model_ready.csv (311 rows, 40 features + risk_level, after
duplicate removal — see DATA_QUALITY_NOTES.md). Given n=311, this prioritizes
small, honestly-validated models over complex ones: repeated stratified CV
with fold-contained preprocessing (no leakage of test-fold statistics into
training), the same protocol pattern as the old pipeline's
compare_models_cv()/cross_validate_model() in ../train.py, reimplemented here
because the old pipeline is scoped to its own 250K-row pooled dataset and is
not imported from.

Does not read or write anything under
../experiments/global_to_local_generalization/.

Run stages independently via the STAGE constant at the bottom, or import the
functions. This file currently implements Stage A (baselines) only.
"""

import json

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support
from sklearn.model_selection import GridSearchCV, RepeatedStratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

DATA_PATH = "sri_lankan_model_ready.csv"
RESULTS_PATH_A = "results_baselines.json"
RESULTS_PATH_B = "results_candidates.json"

RISK_LEVELS = ["Low", "Moderate", "High", "Critical"]
RISK_LEVEL_TO_ORDINAL = {level: i for i, level in enumerate(RISK_LEVELS)}


def load_data():
    df = pd.read_csv(DATA_PATH)
    assert len(df) == 311, f"Expected 311 rows (post-dedup), got {len(df)}"
    y = df["risk_level"].map(RISK_LEVEL_TO_ORDINAL)
    assert y.isna().sum() == 0, "Unmapped risk_level values found"
    X = df.drop(columns=["risk_level"])
    return X, y


def build_preprocessing_pipeline(estimator, feature_columns):
    # All 40 features are already numeric (Likert ints, counts, ordinal
    # tiers, and 0/1 dummies) with zero missingness (see build_features.py's
    # own missingness check) — the imputer here is a safety net only, fit
    # per-fold like the scaler so no fold's statistics leak into another.
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("impute", SimpleImputer(strategy="median")),
                        ("scale", StandardScaler()),
                    ]
                ),
                feature_columns,
            )
        ]
    )
    return Pipeline(steps=[("preprocess", preprocessor), ("model", estimator)])


def cross_validate_model(
    model, X, y, n_splits=5, n_repeats=3, random_state=42, param_grid=None, inner_cv=3
):
    """Repeated stratified CV with fold-contained preprocessing.

    Mirrors ../train.py's cross_validate_model(): a fresh preprocessing
    pipeline is fit on each fold's training rows only. If param_grid is
    given, hyperparameter selection is nested inside each outer fold via
    GridSearchCV on the training rows only (inner_cv-fold), so the held-out
    fold never influences model selection — required given n=311, where
    tuning on the full set first would overfit the tiny remaining signal.
    """
    splitter = RepeatedStratifiedKFold(
        n_splits=n_splits, n_repeats=n_repeats, random_state=random_state
    )
    feature_columns = list(X.columns)

    fold_metrics = {"accuracy": [], "macroF1": [], "weightedF1": []}
    per_class_f1 = {level: [] for level in RISK_LEVELS}
    selected_params = []

    for train_idx, test_idx in splitter.split(X, y):
        pipeline = build_preprocessing_pipeline(clone(model), feature_columns)
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        if param_grid:
            search = GridSearchCV(
                pipeline, param_grid, cv=inner_cv, scoring="f1_macro", n_jobs=-1
            )
            search.fit(X_train, y_train)
            pipeline = search.best_estimator_
            selected_params.append(search.best_params_)
        else:
            pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)

        fold_metrics["accuracy"].append(accuracy_score(y_test, preds))
        fold_metrics["macroF1"].append(f1_score(y_test, preds, average="macro", zero_division=0))
        fold_metrics["weightedF1"].append(
            f1_score(y_test, preds, average="weighted", zero_division=0)
        )

        _, _, f1_per_class, _ = precision_recall_fscore_support(
            y_test, preds, labels=list(range(len(RISK_LEVELS))), zero_division=0
        )
        for level, f1_val in zip(RISK_LEVELS, f1_per_class):
            per_class_f1[level].append(f1_val)

    summary = {}
    for metric, values in fold_metrics.items():
        summary[metric] = {
            "mean": float(np.mean(values)),
            "std": float(np.std(values)),
            "nFolds": len(values),
        }
    summary["perClassF1"] = {
        level: {"mean": float(np.mean(vals)), "std": float(np.std(vals))}
        for level, vals in per_class_f1.items()
    }
    if selected_params:
        summary["selectedParamsPerFold"] = selected_params
    return summary


def run_stage_a(X, y):
    candidates = {
        "DummyMostFrequent": DummyClassifier(strategy="most_frequent", random_state=42),
        "DummyStratified": DummyClassifier(strategy="stratified", random_state=42),
    }

    results = {}
    for name, model in candidates.items():
        print(f"Running repeated CV for {name} (5x3=15 folds)...")
        results[name] = cross_validate_model(model, X, y)

    return results


def run_stage_b(X, y):
    candidates = {
        "LogisticRegression": (
            LogisticRegression(
                multi_class="multinomial", penalty="l2", solver="lbfgs", max_iter=2000,
                random_state=42,
            ),
            {"model__C": [0.01, 0.1, 1.0, 10.0]},
        ),
        "RandomForest_shallow": (
            RandomForestClassifier(random_state=42, n_estimators=200),
            {"model__max_depth": [2, 3, 4], "model__min_samples_leaf": [5, 10, 15]},
        ),
    }

    results = {}
    for name, (model, param_grid) in candidates.items():
        print(f"Running nested repeated CV for {name} (5x3=15 outer folds, inner_cv=3)...")
        results[name] = cross_validate_model(model, X, y, param_grid=param_grid)

    return results


def print_summary(results, baselines=None):
    print()
    print(f"{'Model':22s} {'Accuracy':>18s} {'Macro F1':>18s} {'Weighted F1':>18s}")
    all_results = dict(baselines or {})
    all_results.update(results)
    for name, metrics in all_results.items():
        acc = metrics["accuracy"]
        mf1 = metrics["macroF1"]
        wf1 = metrics["weightedF1"]
        print(
            f"{name:20s} "
            f"{acc['mean']:.4f} +/- {acc['std']:.4f}   "
            f"{mf1['mean']:.4f} +/- {mf1['std']:.4f}   "
            f"{wf1['mean']:.4f} +/- {wf1['std']:.4f}"
        )
    print()
    for name, metrics in results.items():
        print(f"{name} per-class F1 (mean +/- std across 15 folds):")
        for level, vals in metrics["perClassF1"].items():
            print(f"  {level:10s} {vals['mean']:.4f} +/- {vals['std']:.4f}")
        print()


def main():
    X, y = load_data()
    print(f"Loaded {len(X)} rows, {X.shape[1]} features.")
    class_counts = y.value_counts().sort_index()
    print("Class distribution:")
    for ordinal, count in class_counts.items():
        print(f"  {RISK_LEVELS[ordinal]:10s} {count} ({count / len(y) * 100:.1f}%)")
    print()

    baseline_results = run_stage_a(X, y)
    print_summary(baseline_results)

    with open(RESULTS_PATH_A, "w", encoding="utf-8") as f:
        json.dump(
            {
                "stage": "A_baselines",
                "nRows": len(X),
                "nFeatures": X.shape[1],
                "cvProtocol": "RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42)",
                "results": baseline_results,
            },
            f,
            indent=2,
        )
    print(f"Saved results to {RESULTS_PATH_A}")

    candidate_results = run_stage_b(X, y)
    print_summary(candidate_results, baselines=baseline_results)

    with open(RESULTS_PATH_B, "w", encoding="utf-8") as f:
        json.dump(
            {
                "stage": "B_candidates",
                "nRows": len(X),
                "nFeatures": X.shape[1],
                "cvProtocol": (
                    "Outer: RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42); "
                    "Inner: GridSearchCV(cv=3, scoring=f1_macro), nested per outer fold"
                ),
                "results": candidate_results,
                "baselinesForComparison": baseline_results,
            },
            f,
            indent=2,
        )
    print(f"Saved results to {RESULTS_PATH_B}")


if __name__ == "__main__":
    main()
