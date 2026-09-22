"""
train_zero_shot.py

Zero-shot cross-population experiment variant. Does NOT modify or overwrite
the existing authoritative model/results produced by train.py
(model_v2.22-lightgbm, metadata_v2.json, evaluation_results_v2.json, etc).
All new artifacts are written under models/zero_shot/.

Split (Task 1): development = ALL non-Sri-Lankan rows (0 Sri Lankan rows);
evaluation = ALL 314 Sri Lankan rows (none held back for development, since
none were used in training). Preprocessing (imputation, scaling), model
selection (compare_models_cv), and hyperparameter tuning (GridSearchCV) all
fit exclusively on the non-Sri-Lankan development data, reusing train.py's
existing functions unmodified.

Target variants:
  - four-class: reuses the existing riskLabel column produced by
    encode_labels() (Low/Moderate/High/Critical), whose quantile thresholds
    were already fit on non-Sri-Lankan sources only inside generate_dataset.py
    (this script does not refit thresholds).
  - binary: Low+Moderate -> 0, High+Critical -> 1 (Task 2), via a new
    create_binary_risk_labels() helper that does not alter the existing
    four-class create_risk_labels() in generate_dataset.py.
"""

import json
import os

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score

from preprocess import FEATURE_COLUMNS, RISK_LEVELS, encode_labels
from train import (
    SOURCE_TARGET,
    build_preprocessing_pipeline,
    compare_models_cv,
    build_baseline_models,
    evaluate_per_class,
    get_model_candidates,
)
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
    roc_auc_score,
)

ZERO_SHOT_DIR = os.path.join(os.path.dirname(__file__), "models", "zero_shot")
os.makedirs(ZERO_SHOT_DIR, exist_ok=True)

FOUR_CLASS_ORDER = ["Low", "Moderate", "High", "Critical"]
BINARY_CLASS_ORDER = ["LowModerate", "HighCritical"]


def create_sri_lankan_zero_shot_split(df):
    """Development = all non-Sri-Lankan rows only. Evaluation = all Sri Lankan rows.

    Unlike create_sri_lankan_holdout() in train.py (80/20 split of Sri Lankan
    rows between development and holdout), this puts 0% of Sri Lankan rows
    into development and 100% into the evaluation set, since none were used
    in training ("zero-shot" cross-population transfer).
    """
    required = {"source_dataset", "riskLabel"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Cannot create zero-shot split; missing columns: {sorted(missing)}")

    source = df["source_dataset"].astype(str).str.lower()
    sri_mask = source.eq(SOURCE_TARGET.lower())
    sri_df = df.loc[sri_mask].copy()
    non_sri_df = df.loc[~sri_mask].copy()
    if sri_df.empty:
        raise ValueError("No Sri Lankan rows found; refusing to use empty source_split behavior")

    development = non_sri_df.sort_index()
    evaluation = sri_df.sort_index()
    assert set(development.index).isdisjoint(set(evaluation.index))
    assert len(development) + len(evaluation) == len(df)
    assert evaluation["source_dataset"].astype(str).str.lower().eq(SOURCE_TARGET.lower()).all()

    X_dev = development[FEATURE_COLUMNS].copy()
    y_dev = development["riskLabel"].copy()
    X_eval = evaluation[FEATURE_COLUMNS].copy()
    y_eval = evaluation["riskLabel"].copy()

    print(f"Zero-shot development rows (non-Sri-Lankan only): {len(development)}")
    print(f"Zero-shot evaluation rows (all Sri Lankan): {len(evaluation)}")
    print(f"Zero-shot development class distribution: {y_dev.value_counts().sort_index().to_dict()}")
    print(f"Zero-shot evaluation class distribution: {y_eval.value_counts().sort_index().to_dict()}")
    return X_dev, y_dev, X_eval, y_eval


def get_model_candidates_for_class_count(n_classes):
    """Like train.py's get_model_candidates(), but with XGBoost/LightGBM
    objectives matched to the actual number of classes in y.

    train.py's get_model_candidates() hardcodes
    objective="multi:softprob"/num_class=len(RISK_LEVELS) (XGBoost) and
    objective="multiclass"/num_class=len(RISK_LEVELS) (LightGBM) — i.e.
    always 4, regardless of what y actually contains. Reusing that
    unmodified against the Task 2 binary target makes both estimators
    predict as if there were still 4 classes, which crashes sklearn's
    binary metric functions with "Classification metrics can't handle a
    mix of binary and multilabel-indicator targets" (confirmed by running
    the binary variant with the unmodified candidates first). This helper
    is only used for n_classes != 4; the four-class variant still uses
    train.py's get_model_candidates() unmodified.
    """
    if n_classes == len(RISK_LEVELS):
        return get_model_candidates()
    return {
        "LogisticRegression": (
            LogisticRegression(max_iter=2000),
            {"C": [0.1, 1.0, 10.0]},
        ),
        "RandomForest": (
            RandomForestClassifier(random_state=42, n_jobs=-1),
            {"n_estimators": [50], "max_depth": [8], "min_samples_leaf": [2]},
        ),
        "XGBoost": (
            XGBClassifier(
                objective="binary:logistic",
                eval_metric="logloss",
                random_state=42,
                n_jobs=-1,
                tree_method="hist",
            ),
            {"n_estimators": [50], "max_depth": [5], "learning_rate": [0.1]},
        ),
        "LightGBM": (
            LGBMClassifier(
                objective="binary",
                random_state=42,
                n_jobs=-1,
                verbose=-1,
            ),
            {"n_estimators": [50], "max_depth": [5], "learning_rate": [0.1]},
        ),
    }


def create_binary_risk_labels(risk_label_series):
    """Re-bin the existing four-class riskLabel (0=Low..3=Critical) into two
    classes: Low+Moderate (0,1) -> 0, High+Critical (2,3) -> 1.

    Does not alter create_risk_labels() in generate_dataset.py, which remains
    the sole source of the four-class labels this function re-bins.
    """
    mapping = {0: 0, 1: 0, 2: 1, 3: 1}
    unmapped = set(risk_label_series.unique()) - set(mapping)
    if unmapped:
        raise ValueError(f"Unexpected riskLabel values for binary re-binning: {unmapped}")
    return risk_label_series.map(mapping)


def evaluate_generic(model, X, y, class_order):
    """Same metric set as train.py's evaluate(), parameterised over class count
    so it works for both the 4-class and binary label spaces."""
    n_classes = len(class_order)
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)
    report = classification_report(
        y, y_pred,
        labels=list(range(n_classes)),
        target_names=class_order,
        output_dict=True,
        zero_division=0,
    )
    per_class = {
        name: {
            "precision": float(report[name]["precision"]),
            "recall": float(report[name]["recall"]),
            "f1": float(report[name]["f1-score"]),
            "support": int(report[name]["support"]),
        }
        for name in class_order
    }
    try:
        if n_classes == 2:
            roc_auc = float(roc_auc_score(y, y_proba[:, 1]))
        else:
            roc_auc = float(roc_auc_score(y, y_proba, multi_class="ovr", labels=list(range(n_classes))))
    except ValueError as exc:
        roc_auc = None
        print(f"WARNING: ROC-AUC could not be computed ({exc})")

    matrix = confusion_matrix(y, y_pred, labels=list(range(n_classes)))
    return {
        "accuracy": float(accuracy_score(y, y_pred)),
        "macroPrecision": float(precision_recall_fscore_support(y, y_pred, average="macro", zero_division=0)[0]),
        "macroRecall": float(precision_recall_fscore_support(y, y_pred, average="macro", zero_division=0)[1]),
        "macroF1": float(f1_score(y, y_pred, average="macro", zero_division=0)),
        "weightedF1": float(f1_score(y, y_pred, average="weighted", zero_division=0)),
        "rocAUC": roc_auc,
        "perClass": per_class,
        "confusionMatrix": {"labels": class_order, "matrix": matrix.astype(int).tolist()},
    }


def fit_best_model_with_candidates(X_train, y_train, candidates, candidate_names):
    """Same tuning protocol as train.py's fit_best_model() (GridSearchCV,
    cv=2, scoring="f1_weighted", preprocessing refit per grid fold via
    build_preprocessing_pipeline), but takes an explicit candidates dict
    instead of always calling train.py's hardcoded-for-4-classes
    get_model_candidates() internally. Needed because that function's
    XGBoost/LightGBM configs assume num_class=4 and break for the binary
    variant (see get_model_candidates_for_class_count's docstring).
    """
    from datetime import datetime, timezone
    from sklearn.model_selection import GridSearchCV

    if len(X_train) > 100000:
        from sklearn.model_selection import train_test_split as tts
        X_train_sample, _, y_train_sample, _ = tts(
            X_train, y_train, train_size=50000, random_state=42, stratify=y_train
        )
        print(f"Large dataset detected ({len(X_train)} rows). Using stratified subsample of {len(X_train_sample)} rows for GridSearchCV.")
        X_train = X_train_sample
        y_train = y_train_sample

    candidates = {name: candidates[name] for name in candidate_names}
    results = {}
    trained = {}
    total = len(candidates)
    for idx, (name, (model, param_grid)) in enumerate(candidates.items(), start=1):
        grid_size = 1
        for values in param_grid.values():
            grid_size *= len(values)
        print(f"[{idx}/{total}] Starting {name}...")
        print(f"  Training rows: {len(X_train)}")
        print(f"  Feature count: {X_train.shape[1]}")
        print(f"  Grid combinations: {grid_size}")
        started = datetime.now(timezone.utc)
        pipeline = build_preprocessing_pipeline(model)
        pipeline_grid = {f"model__{key}": values for key, values in param_grid.items()}
        search = GridSearchCV(pipeline, pipeline_grid, scoring="f1_weighted", cv=2, n_jobs=-1, verbose=1)
        search.fit(X_train, y_train)
        model = search.best_estimator_
        elapsed = (datetime.now(timezone.utc) - started).total_seconds()
        print(f"Best params for {name}: {search.best_params_}")
        print(f"[{idx}/{total}] Completed {name} in {elapsed:.1f}s")
        results[name] = {"bestParams": search.best_params_, "cvBestScore": float(search.best_score_)}
        trained[name] = model
    best = max(results, key=lambda n: results[n]["cvBestScore"])
    return best, trained[best], results


def run_variant(df, class_order, label_column, variant_name):
    print(f"\n{'=' * 70}\nZERO-SHOT VARIANT: {variant_name}\n{'=' * 70}")

    working_df = df.copy()
    working_df["riskLabel"] = working_df[label_column]

    X_dev, y_dev, X_eval, y_eval = create_sri_lankan_zero_shot_split(working_df)

    print(f"\n[data-touch check] Preprocessing/tuning/model-selection inputs: "
          f"X_dev has {len(X_dev)} rows, all non-Sri-Lankan "
          f"({set(df.loc[X_dev.index, 'source_dataset'].astype(str).str.lower())}).")
    print(f"[data-touch check] Evaluation input: X_eval has {len(X_eval)} rows, all Sri Lankan "
          f"({set(df.loc[X_eval.index, 'source_dataset'].astype(str).str.lower())}).")

    # Model comparison (compare_models_cv) and its internal preprocessing fits
    # (build_preprocessing_pipeline -> SimpleImputer/StandardScaler) run only
    # on X_dev/y_dev. X_eval/y_eval are not passed to this step.
    ml_candidates = get_model_candidates_for_class_count(len(class_order))
    cv_results = compare_models_cv(X_dev, y_dev, ml_candidates)
    cv_results_path = os.path.join(ZERO_SHOT_DIR, f"cv_results_{variant_name}.json")
    with open(cv_results_path, "w", encoding="utf-8") as f:
        json.dump(cv_results, f, indent=2)

    best_cv_name = max(ml_candidates, key=lambda name: cv_results[name]["macroF1"]["mean"])
    print("\nRepeated stratified CV summary (zero-shot development data only):")
    print(f"{'Model':<20} {'Accuracy':>18} {'Macro F1':>18} {'Weighted F1':>18} {'ROC-AUC':>18}")
    print("-" * 96)
    for name, metrics in cv_results.items():
        def formatted(metric_name):
            m = metrics[metric_name]
            return "n/a" if m["mean"] is None else f"{m['mean']:.4f} +/- {m['std']:.4f}"
        print(f"{name:<20} {formatted('accuracy'):>18} {formatted('macroF1'):>18} "
              f"{formatted('weightedF1'):>18} {formatted('rocAUC'):>18}")
    print(f"Selected by repeated CV: {best_cv_name}")

    # Final hyperparameter tuning (GridSearchCV) also fits only on X_dev/y_dev;
    # its ColumnTransformer/imputer/scaler are refit inside each CV fold of
    # GridSearchCV, never touching X_eval.
    #
    # NOTE: this must use fit_best_model_with_candidates() with the same
    # class-count-matched ml_candidates built above, NOT train.py's own
    # fit_best_model() — that function looks candidate_names up in its own
    # internal get_model_candidates(), which hardcodes objective=
    # "multi:softprob"/num_class=4 (XGBoost) and "multiclass"/num_class=4
    # (LightGBM) regardless of the actual y passed in. For the four-class
    # variant that's harmless (it's the same config ml_candidates already
    # has). For the binary variant it silently rebuilds a 4-class-configured
    # XGBoost/LightGBM, which produces predictions incompatible with binary
    # y and crashes classification_report downstream (confirmed by running
    # this exact call unmodified first: "ValueError: Classification metrics
    # can't handle a mix of binary and multilabel-indicator targets").
    best_name, best_pipeline, tuning_results = fit_best_model_with_candidates(
        X_dev, y_dev, ml_candidates, candidate_names=[best_cv_name]
    )

    dev_metrics = evaluate_generic(best_pipeline, X_dev, y_dev, class_order)

    # First and only time X_eval/y_eval touch the fitted pipeline: transform +
    # predict on the already-fitted preprocessing/model. No refitting here.
    assert set(X_eval.index).isdisjoint(set(X_dev.index))
    eval_metrics = evaluate_generic(best_pipeline, X_eval, y_eval, class_order)

    results = {
        "variant": variant_name,
        "classOrder": class_order,
        "selectedModel": best_name,
        "cvSelection": {
            "selectedByRepeatedCV": best_cv_name,
            "cvResultsFile": os.path.basename(cv_results_path),
        },
        "tuning": tuning_results,
        "developmentRows": int(len(X_dev)),
        "evaluationRows": int(len(X_eval)),
        "developmentClassDistribution": {class_order[k]: int(v) for k, v in y_dev.value_counts().sort_index().items()},
        "evaluationClassDistribution": {class_order[k]: int(v) for k, v in y_eval.value_counts().sort_index().items()},
        "developmentMetrics": dev_metrics,
        "sriLankanZeroShotEvaluationMetrics": eval_metrics,
        "dataTouchConfirmation": {
            "preprocessingFitData": "non-Sri-Lankan development rows only (X_dev)",
            "modelSelectionCVData": "non-Sri-Lankan development rows only (X_dev, via compare_models_cv)",
            "hyperparameterTuningData": "non-Sri-Lankan development rows only (X_dev, via GridSearchCV inside fit_best_model_with_candidates)",
            "targetThresholdFitData": (
                "riskLabel column reused unmodified from dataset.csv; its underlying "
                "quantile thresholds were fit on non-Sri-Lankan sources only inside "
                "generate_dataset.py (see dataset_target_construction_metadata.json); "
                "this script does not refit thresholds"
                if variant_name == "four_class"
                else "binary label is a deterministic re-bin of the above four-class riskLabel; no new threshold fitting performed"
            ),
            "sriLankanRowsInDevelopment": 0,
            "sriLankanRowsInEvaluation": int(len(X_eval)),
        },
    }

    # Save artifacts under models/zero_shot/, never touching the existing
    # models/model_v2.22-lightgbm.pkl or models/metadata_v2.json.
    import joblib
    best_model = best_pipeline.named_steps["model"]
    preprocessing = best_pipeline.named_steps["preprocessing"]
    joblib.dump(best_model, os.path.join(ZERO_SHOT_DIR, f"model_{variant_name}_{best_name.lower()}.pkl"))
    joblib.dump(preprocessing, os.path.join(ZERO_SHOT_DIR, f"scaler_{variant_name}_{best_name.lower()}.pkl"))

    results_path = os.path.join(ZERO_SHOT_DIR, f"results_{variant_name}.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved zero-shot results for variant '{variant_name}' to {results_path}")

    return results


def main():
    raw_df = pd.read_csv("dataset.csv", low_memory=False)
    df = encode_labels(raw_df)  # existing four-class riskLabel, 0..3

    four_class_results = run_variant(
        df, FOUR_CLASS_ORDER, label_column="riskLabel", variant_name="four_class"
    )

    df_binary = df.copy()
    df_binary["riskLabelBinary"] = create_binary_risk_labels(df["riskLabel"])
    binary_results = run_variant(
        df_binary, BINARY_CLASS_ORDER, label_column="riskLabelBinary", variant_name="binary"
    )

    summary = {
        "fourClass": {
            "selectedModel": four_class_results["selectedModel"],
            "developmentRows": four_class_results["developmentRows"],
            "evaluationRows": four_class_results["evaluationRows"],
            "evaluationClassDistribution": four_class_results["evaluationClassDistribution"],
            "macroF1": four_class_results["sriLankanZeroShotEvaluationMetrics"]["macroF1"],
            "weightedF1": four_class_results["sriLankanZeroShotEvaluationMetrics"]["weightedF1"],
            "rocAUC": four_class_results["sriLankanZeroShotEvaluationMetrics"]["rocAUC"],
        },
        "binary": {
            "selectedModel": binary_results["selectedModel"],
            "developmentRows": binary_results["developmentRows"],
            "evaluationRows": binary_results["evaluationRows"],
            "evaluationClassDistribution": binary_results["evaluationClassDistribution"],
            "macroF1": binary_results["sriLankanZeroShotEvaluationMetrics"]["macroF1"],
            "weightedF1": binary_results["sriLankanZeroShotEvaluationMetrics"]["weightedF1"],
            "rocAUC": binary_results["sriLankanZeroShotEvaluationMetrics"]["rocAUC"],
        },
    }
    with open(os.path.join(ZERO_SHOT_DIR, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\n{'=' * 70}\nZero-shot experiment complete. Summary saved to "
          f"{os.path.join(ZERO_SHOT_DIR, 'summary.json')}\n{'=' * 70}")


if __name__ == "__main__":
    main()
