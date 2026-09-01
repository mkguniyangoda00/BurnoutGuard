"""
train.py

Trains multiple burnout-risk models using a source-aware split, evaluates
domain shift, external validation, calibration, and uncertainty-aware
predictions, then saves the best calibrated artifact bundle.
"""

import json
import os
from datetime import datetime, timezone
from itertools import combinations

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import GridSearchCV, RepeatedStratifiedKFold
from sklearn.base import BaseEstimator, ClassifierMixin, clone
from sklearn.compose import ColumnTransformer
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, brier_score_loss, classification_report, confusion_matrix, f1_score, log_loss, precision_recall_fscore_support, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from preprocess import FEATURE_COLUMNS, MODELS_DIR, RISK_LEVELS, encode_labels
from explain import compute_global_feature_importance, compute_pipeline_shap_results

os.makedirs(MODELS_DIR, exist_ok=True)
EXPERIMENTS_DIR = os.path.join(os.path.dirname(__file__), "experiments", "results")
os.makedirs(EXPERIMENTS_DIR, exist_ok=True)

SOURCE_TARGET = "sri_lankan_developer_burnout"
CLASS_ORDER = ["Low", "Moderate", "High", "Critical"]


class ComputationalHeuristicClassifier(BaseEstimator, ClassifierMixin):
    """Transparent computational comparator, not a clinical burnout rule."""

    def fit(self, X, y):
        X = np.asarray(X, dtype=float)
        self.classes_ = np.arange(len(CLASS_ORDER))
        # Inputs are fold-fitted standardized features. This deliberately
        # simple equal-weight score is only a non-learning comparator.
        score = X[:, 4] + X[:, 6] + X[:, 9] - X[:, 0]
        self.thresholds_ = np.quantile(score, [0.25, 0.50, 0.75])
        return self

    def predict(self, X):
        X = np.asarray(X, dtype=float)
        score = X[:, 4] + X[:, 6] + X[:, 9] - X[:, 0]
        return np.digitize(score, self.thresholds_).astype(int)

    def predict_proba(self, X):
        predictions = self.predict(X)
        probabilities = np.zeros((len(predictions), len(CLASS_ORDER)))
        probabilities[np.arange(len(predictions)), predictions] = 1.0
        return probabilities


def evaluate_per_class(y_true, y_pred):
    """Return named per-class metrics in the canonical risk-level order."""
    report = classification_report(
        y_true,
        y_pred,
        labels=list(range(len(CLASS_ORDER))),
        target_names=CLASS_ORDER,
        output_dict=True,
        zero_division=0,
    )
    return {
        class_name: {
            "precision": float(report[class_name]["precision"]),
            "recall": float(report[class_name]["recall"]),
            "f1": float(report[class_name]["f1-score"]),
            "support": int(report[class_name]["support"]),
        }
        for class_name in CLASS_ORDER
    }


def build_confusion_matrix(y_true, y_pred):
    """Return a confusion matrix with rows/columns ordered Low to Critical."""
    matrix = confusion_matrix(
        y_true,
        y_pred,
        labels=list(range(len(CLASS_ORDER))),
    )
    return {
        "labels": CLASS_ORDER,
        "matrix": matrix.astype(int).tolist(),
    }


def build_preprocessing_pipeline(model, feature_columns=None):
    """Return a pipeline that learns every feature transform from fit data.

    All canonical predictors are numeric. The ``SimpleImputer`` and
    ``StandardScaler`` therefore live inside a ``ColumnTransformer`` and are
    fitted by ``GridSearchCV`` separately on every training fold. The external
    Sri Lankan holdout is passed to ``transform`` only after this pipeline has
    been fitted on development data.
    """
    feature_columns = list(feature_columns or FEATURE_COLUMNS)
    numeric_preprocessing = Pipeline([
        ("imputation", SimpleImputer(strategy="median")),
        ("scaling", StandardScaler()),
    ])
    preprocessing = ColumnTransformer(
        [("numeric", numeric_preprocessing, feature_columns)],
        remainder="drop",
    )
    return Pipeline([
        ("preprocessing", preprocessing),
        ("model", model),
    ])


def cross_validate_model(model, X, y, feature_columns=None):
    """Evaluate one candidate with repeated, fold-contained preprocessing."""
    splitter = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42)
    metric_functions = {
        "accuracy": accuracy_score,
        "macroPrecision": lambda actual, predicted: precision_recall_fscore_support(
            actual, predicted, average="macro", zero_division=0
        )[0],
        "macroRecall": lambda actual, predicted: precision_recall_fscore_support(
            actual, predicted, average="macro", zero_division=0
        )[1],
        "macroF1": lambda actual, predicted: f1_score(actual, predicted, average="macro"),
        "weightedF1": lambda actual, predicted: f1_score(actual, predicted, average="weighted"),
    }
    scores = {metric: [] for metric in metric_functions}
    scores["rocAUC"] = []

    for train_indices, test_indices in splitter.split(X, y):
        fold_pipeline = build_preprocessing_pipeline(clone(model), feature_columns)
        X_fold_train = X.iloc[train_indices] if hasattr(X, "iloc") else X[train_indices]
        X_fold_test = X.iloc[test_indices] if hasattr(X, "iloc") else X[test_indices]
        y_fold_train = y.iloc[train_indices] if hasattr(y, "iloc") else y[train_indices]
        y_fold_test = y.iloc[test_indices] if hasattr(y, "iloc") else y[test_indices]

        # Every imputer/scaler fit below sees only this fold's training rows.
        fold_pipeline.fit(X_fold_train, y_fold_train)
        predictions = fold_pipeline.predict(X_fold_test)
        probabilities = fold_pipeline.predict_proba(X_fold_test)
        for metric, function in metric_functions.items():
            scores[metric].append(float(function(y_fold_test, predictions)))
        try:
            scores["rocAUC"].append(float(roc_auc_score(
                y_fold_test,
                probabilities,
                multi_class="ovr",
                labels=list(range(len(RISK_LEVELS))),
            )))
        except ValueError:
            # AUC is undefined when a fold does not contain every class.
            scores["rocAUC"].append(None)

    summary = {}
    for metric, fold_scores in scores.items():
        valid_scores = [score for score in fold_scores if score is not None]
        summary[metric] = {
            "mean": float(np.mean(valid_scores)) if valid_scores else None,
            "std": float(np.std(valid_scores, ddof=1)) if len(valid_scores) > 1 else 0.0 if valid_scores else None,
            "foldScores": fold_scores,
        }
    return summary


def compare_models_cv(X, y, candidates):
    """Compare all candidate estimators using the same repeated CV protocol."""
    results = {}
    for name, candidate in candidates.items():
        model = candidate[0] if isinstance(candidate, tuple) else candidate
        print(f"Running repeated CV for {name} (15 folds)...")
        results[name] = cross_validate_model(model, X, y)
    return results


def bootstrap_metric_ci(
    y_true,
    predictions_a,
    predictions_b,
    metric="macro_f1",
    n_bootstrap=1000,
    random_state=42,
):
    """Estimate a paired bootstrap CI for model A minus model B.

    ``predictions_a`` and ``predictions_b`` must be predictions for the same
    internal development observations. They may be class labels or class
    probabilities for ROC-AUC. No model fitting or external holdout data is
    performed here.
    """
    y_true = np.asarray(y_true)
    predictions_a = np.asarray(predictions_a)
    predictions_b = np.asarray(predictions_b)
    if len(y_true) == 0 or len(predictions_a) != len(y_true) or len(predictions_b) != len(y_true):
        raise ValueError("y_true and both prediction arrays must have the same non-zero length")
    if n_bootstrap < 1:
        raise ValueError("n_bootstrap must be at least 1")

    metric_name = metric.lower().replace("-", "_")

    def calculate(actual, predictions):
        if metric_name in {"macro_f1", "macrof1"}:
            return f1_score(actual, predictions, average="macro", zero_division=0)
        if metric_name in {"accuracy", "acc"}:
            return accuracy_score(actual, predictions)
        if metric_name in {"macro_precision", "macroprecision"}:
            return precision_recall_fscore_support(
                actual, predictions, average="macro", zero_division=0
            )[0]
        if metric_name in {"macro_recall", "macrorecall"}:
            return precision_recall_fscore_support(
                actual, predictions, average="macro", zero_division=0
            )[1]
        if metric_name in {"weighted_f1", "weightedf1"}:
            return f1_score(actual, predictions, average="weighted", zero_division=0)
        if metric_name in {"roc_auc", "rocauc"}:
            return roc_auc_score(
                actual,
                predictions,
                multi_class="ovr",
                labels=list(range(len(RISK_LEVELS))),
            )
        raise ValueError(f"Unsupported bootstrap metric: {metric}")

    observed_a = calculate(y_true, predictions_a)
    observed_b = calculate(y_true, predictions_b)
    observed_difference = float(observed_a - observed_b)
    rng = np.random.RandomState(random_state)
    differences = []
    for _ in range(n_bootstrap):
        indices = rng.randint(0, len(y_true), size=len(y_true))
        try:
            score_a = calculate(y_true[indices], predictions_a[indices])
            score_b = calculate(y_true[indices], predictions_b[indices])
            differences.append(float(score_a - score_b))
        except ValueError:
            # A resample can omit a class, making multiclass ROC-AUC undefined.
            continue
    if not differences:
        raise ValueError(f"No valid bootstrap samples for metric '{metric}'")

    confidence_level = 0.95
    alpha = 1.0 - confidence_level
    return {
        "observed_difference": observed_difference,
        "ci_lower": float(np.percentile(differences, 100 * alpha / 2)),
        "ci_upper": float(np.percentile(differences, 100 * (1 - alpha / 2))),
        "confidence_level": confidence_level,
    }


def collect_oof_predictions(model, X, y, max_samples=10000):
    """Create common five-fold OOF predictions from development data only.

    A bounded stratified sample keeps the paired bootstrap computationally
    tractable for the tree ensembles while retaining the same observations
    for every model comparison.
    """
    if len(X) > max_samples:
        X, _, y, _ = train_test_split(
            X,
            y,
            train_size=max_samples,
            random_state=42,
            stratify=y,
        )
        X = X.reset_index(drop=True) if hasattr(X, "reset_index") else X
        y = y.reset_index(drop=True) if hasattr(y, "reset_index") else y
    splitter = RepeatedStratifiedKFold(n_splits=5, n_repeats=1, random_state=42)
    predictions = np.empty(len(y), dtype=int)
    probabilities = np.empty((len(y), len(RISK_LEVELS)), dtype=float)
    for train_indices, test_indices in splitter.split(X, y):
        pipeline = build_preprocessing_pipeline(clone(model))
        X_fold_train = X.iloc[train_indices] if hasattr(X, "iloc") else X[train_indices]
        X_fold_test = X.iloc[test_indices] if hasattr(X, "iloc") else X[test_indices]
        y_fold_train = y.iloc[train_indices] if hasattr(y, "iloc") else y[train_indices]
        pipeline.fit(X_fold_train, y_fold_train)
        predictions[test_indices] = pipeline.predict(X_fold_test)
        probabilities[test_indices] = pipeline.predict_proba(X_fold_test)
    return y.to_numpy(), predictions, probabilities


def create_sri_lankan_holdout(df, test_size=0.20, random_state=42):
    """Create a stratified, source-aware development/holdout split.

    The split is performed on raw source-tagged rows before imputation,
    scaling, model selection, calibration, or explainability sampling.
    Non-Sri-Lankan rows are always development data; 20% of Sri Lankan rows
    are held out exclusively for the final external evaluation.
    """
    required = {"source_dataset", "riskLabel"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Cannot create Sri Lankan holdout; missing columns: {sorted(missing)}")
    if not 0 < test_size < 1:
        raise ValueError("test_size must be between 0 and 1")

    source = df["source_dataset"].astype(str).str.lower()
    sri_mask = source.eq(SOURCE_TARGET.lower())
    sri_df = df.loc[sri_mask].copy()
    non_sri_df = df.loc[~sri_mask].copy()
    if sri_df.empty:
        raise ValueError("No Sri Lankan rows found; refusing to use empty source_split behavior")

    sri_dev, sri_holdout = train_test_split(
        sri_df,
        test_size=test_size,
        random_state=random_state,
        stratify=sri_df["riskLabel"],
    )
    development = pd.concat([non_sri_df, sri_dev], axis=0).sort_index()
    holdout = sri_holdout.sort_index()
    assert set(development.index).isdisjoint(set(holdout.index))
    assert len(development) + len(holdout) == len(df)
    assert holdout["source_dataset"].astype(str).str.lower().eq(SOURCE_TARGET.lower()).all()

    X_dev = development[FEATURE_COLUMNS].copy()
    y_dev = development["riskLabel"].copy()
    X_sl_holdout = holdout[FEATURE_COLUMNS].copy()
    y_sl_holdout = holdout["riskLabel"].copy()

    print(f"Total Sri Lankan records: {len(sri_df)}")
    print(f"Sri Lankan development records: {len(sri_dev)}")
    print(f"Sri Lankan holdout records: {len(sri_holdout)}")
    print(f"Sri Lankan total class distribution: {sri_df['riskLabel'].value_counts().sort_index().to_dict()}")
    print(f"Sri Lankan development class distribution: {y_dev.loc[sri_dev.index].value_counts().sort_index().to_dict()}")
    print(f"Sri Lankan holdout class distribution: {y_sl_holdout.value_counts().sort_index().to_dict()}")
    return X_dev, y_dev, X_sl_holdout, y_sl_holdout


def expected_calibration_error(y_true, y_prob, n_bins=10):
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
      mask = (y_prob >= bins[i]) & (y_prob < bins[i + 1] if i < n_bins - 1 else y_prob <= bins[i + 1])
      if not np.any(mask):
        continue
      acc = y_true[mask].mean()
      conf = y_prob[mask].mean()
      ece += np.abs(acc - conf) * (mask.sum() / len(y_true))
    return float(ece)


def evaluate(model, X, y):
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)
    per_class = evaluate_per_class(y, y_pred)
    try:
        roc_auc = float(roc_auc_score(
            y,
            y_proba,
            multi_class="ovr",
            labels=list(range(len(CLASS_ORDER))),
        ))
    except ValueError:
        roc_auc = None
    metrics = {
        "accuracy": float(accuracy_score(y, y_pred)),
        "macroPrecision": float(precision_recall_fscore_support(y, y_pred, average="macro", zero_division=0)[0]),
        "macroRecall": float(precision_recall_fscore_support(y, y_pred, average="macro", zero_division=0)[1]),
        "macroF1": float(f1_score(y, y_pred, average="macro", zero_division=0)),
        "weightedF1": float(f1_score(y, y_pred, average="weighted", zero_division=0)),
        "rocAUC": roc_auc,
        "perClass": per_class,
        "confusionMatrix": build_confusion_matrix(y, y_pred),
        "criticalRecall": per_class["Critical"]["recall"],
    }
    # Preserve existing artifact consumers while exposing the clearer names above.
    metrics.update({
        "f1Score": metrics["weightedF1"],
        "macroAuc": metrics["rocAUC"],
        "logLoss": float(log_loss(y, y_proba)),
        "precisionPerClass": [per_class[name]["precision"] for name in CLASS_ORDER],
        "recallPerClass": [per_class[name]["recall"] for name in CLASS_ORDER],
        "f1PerClass": [per_class[name]["f1"] for name in CLASS_ORDER],
        "supportPerClass": [per_class[name]["support"] for name in CLASS_ORDER],
    })
    return metrics


def calibration_report(model, X, y):
    proba = model.predict_proba(X)
    y_bin = label_binarize(y, classes=list(range(len(RISK_LEVELS))))
    class_ece = []
    class_brier = []
    for idx in range(len(RISK_LEVELS)):
        class_ece.append(expected_calibration_error(y_bin[:, idx], proba[:, idx]))
        class_brier.append(float(brier_score_loss(y_bin[:, idx], proba[:, idx])))
    return {
        "ece": float(np.mean(class_ece)),
        "brier": float(np.mean(class_brier)),
        "classEce": class_ece,
        "classBrier": class_brier,
    }


def domain_shift_report(source_df, target_df):
    rows = {}
    for col in FEATURE_COLUMNS:
        if col not in source_df.columns or col not in target_df.columns:
            continue
        source = pd.to_numeric(source_df[col], errors="coerce").dropna()
        target = pd.to_numeric(target_df[col], errors="coerce").dropna()
        if len(source) == 0 or len(target) == 0:
            continue
        rows[col] = {
            "sourceMean": float(source.mean()),
            "targetMean": float(target.mean()),
            "meanDiff": float(target.mean() - source.mean()),
        }
    return rows


def build_duplicate_fingerprint(df):
    cols = [col for col in FEATURE_COLUMNS if col in df.columns]
    if not cols:
        return pd.Series(dtype=str)
    normalized = pd.DataFrame(index=df.index)
    for col in cols:
        series = pd.to_numeric(df[col], errors="coerce")
        normalized[col] = series.apply(lambda v: "<NA>" if pd.isna(v) else round(float(v), 6))
    # Use hash instead of string concatenation for large datasets (faster comparison)
    import hashlib
    def hash_row(row):
        row_str = "|".join(str(x) for x in row)
        return hashlib.md5(row_str.encode()).hexdigest()
    return normalized.apply(hash_row, axis=1)


def duplicate_audit(df):
    fingerprints = build_duplicate_fingerprint(df)
    audit_df = df.copy()
    audit_df["_fingerprint"] = fingerprints
    exact_dupe_rows = int(audit_df.duplicated(keep=False).sum())
    fingerprint_counts = audit_df["_fingerprint"].value_counts()
    duplicate_fingerprints = int((fingerprint_counts > 1).sum())
    cross_source = 0
    collision_groups = []
    if "source_dataset" in audit_df.columns:
        # For efficiency with large datasets, only process fingerprints with duplicates
        dup_fingerprints = fingerprint_counts[fingerprint_counts > 1].index.tolist()
        for fingerprint in dup_fingerprints:
            rows = audit_df[audit_df["_fingerprint"] == fingerprint]
            sources = sorted(set(rows["source_dataset"].dropna().astype(str)))
            if len(sources) > 1:
                cross_source += 1
            collision_groups.append({
                "fingerprint": fingerprint,
                "rowCount": int(len(rows)),
                "sourceDatasets": sources,
                "automaticallyRemoved": 0,
            })
    payload = {
        "totalRows": int(len(df)),
        "exactDuplicateRows": exact_dupe_rows,
        "uniquePredictorFingerprints": int(fingerprint_counts.shape[0]),
        "predictorFingerprintCollisionGroups": duplicate_fingerprints,
        "crossSourceCollisionGroups": cross_source,
        "automaticallyRemovedRows": 0,
        "collisionGroups": collision_groups,
    }
    out_json = os.path.join(EXPERIMENTS_DIR, "duplicate_audit.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    out_md = os.path.join(EXPERIMENTS_DIR, "duplicate_audit_summary.md")
    with open(out_md, "w", encoding="utf-8") as f:
        f.write(
            "# Duplicate Audit\n\n"
            f"Total rows: {payload['totalRows']}\n\n"
            f"Exact duplicate rows: {payload['exactDuplicateRows']}\n\n"
            f"Unique predictor fingerprints: {payload['uniquePredictorFingerprints']}\n\n"
            f"Predictor fingerprint collision groups: {payload['predictorFingerprintCollisionGroups']}\n\n"
            f"Cross-source collision groups: {payload['crossSourceCollisionGroups']}\n\n"
            f"Automatically removed rows: {payload['automaticallyRemovedRows']}\n"
        )
    return payload


def get_model_candidates():
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
                objective="multi:softprob",
                num_class=len(RISK_LEVELS),
                eval_metric="mlogloss",
                random_state=42,
                n_jobs=-1,
                tree_method="hist",
            ),
            {"n_estimators": [50], "max_depth": [5], "learning_rate": [0.1]},
        ),
        "LightGBM": (
            LGBMClassifier(
                objective="multiclass",
                num_class=len(RISK_LEVELS),
                random_state=42,
                n_jobs=-1,
                verbose=-1,
            ),
            {"n_estimators": [50], "max_depth": [5], "learning_rate": [0.1]},
        ),
    }


def build_baseline_models():
    """Return non-learning and computational baseline estimators.

    The heuristic is not a medically validated threshold. It is a transparent
    computational comparator using equal-weight standardized sleep, work,
    overtime, and stress signals; its quartile cut points are fit separately
    inside each CV training fold.
    """
    from sklearn.dummy import DummyClassifier

    return {
        "DummyStratified": DummyClassifier(strategy="stratified", random_state=42),
        "DummyMostFrequent": DummyClassifier(strategy="most_frequent"),
        "ComputationalHeuristic": ComputationalHeuristicClassifier(),
    }


def train_calibrator(model, X_cal, y_cal):
    base_probs = model.predict_proba(X_cal)
    calibrators = []
    for idx in range(base_probs.shape[1]):
        y_binary = (y_cal.to_numpy() == idx).astype(int)
        iso = IsotonicRegression(out_of_bounds="clip")
        iso.fit(base_probs[:, idx], y_binary)
        calibrators.append(iso)
    return calibrators


def apply_calibrators(model, calibrators, X):
    probs = model.predict_proba(X)
    calibrated = np.column_stack([calibrators[idx].transform(probs[:, idx]) for idx in range(probs.shape[1])])
    calibrated = np.clip(calibrated, 1e-6, 1)
    calibrated = calibrated / calibrated.sum(axis=1, keepdims=True)
    return calibrated


def compute_shap_stability(pipeline, X, y, seeds=(42, 43, 44), top_k=10):
    """Measure ranking stability across development-only bootstrap fits."""
    sample = X.sample(n=min(500, len(X)), random_state=42)
    rankings = []
    for seed in seeds:
        rng = np.random.RandomState(seed)
        indices = rng.randint(0, len(X), size=len(X))
        fitted = clone(pipeline)
        y_boot = y.iloc[indices] if hasattr(y, "iloc") else y[indices]
        fitted.fit(X.iloc[indices], y_boot)
        result = compute_pipeline_shap_results(fitted, sample, local_rows=1)
        rankings.append(result["featureRanking"][:top_k])
    counts = {}
    for ranking in rankings:
        for feature in ranking:
            counts[feature] = counts.get(feature, 0) + 1
    stable = [
        {"featureName": feature, "appearanceRate": count / len(rankings)}
        for feature, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]
    return {
        "seeds": list(seeds),
        "topK": top_k,
        "rankings": rankings,
        "appearanceRates": stable,
        "interpretation": "Features with low appearance rates are unstable across development resamples and should not be presented as robust global findings.",
    }


def fit_best_model(X_train, y_train, candidate_names=None):
    # The class distributions in this feature set tend to respond well to
    # linear decision boundaries, but we still tune the tree baselines with a
    # standard grid search so they are compared fairly.
    
    # For very large datasets (>100k samples), use a stratified subsample for faster training
    if len(X_train) > 100000:
        from sklearn.model_selection import train_test_split as tts
        X_train_sample, _, y_train_sample, _ = tts(
            X_train, y_train, 
            train_size=50000, 
            random_state=42, 
            stratify=y_train
        )
        print(f"Large dataset detected ({len(X_train)} rows). Using stratified subsample of {len(X_train_sample)} rows for GridSearchCV.")
        X_train = X_train_sample
        y_train = y_train_sample
    
    candidates = get_model_candidates()
    if candidate_names is not None:
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
        search = GridSearchCV(
            pipeline,
            pipeline_grid,
            scoring="f1_weighted",
            cv=2,
            n_jobs=-1,
            verbose=1,
        )
        search.fit(X_train, y_train)
        model = search.best_estimator_
        elapsed = (datetime.now(timezone.utc) - started).total_seconds()
        print(f"Best params for {name}: {search.best_params_}")
        print(f"[{idx}/{total}] Completed {name} in {elapsed:.1f}s")
        results[name] = {"bestParams": search.best_params_, "cvBestScore": float(search.best_score_)}
        trained[name] = model
    best = max(results, key=lambda n: results[n]["cvBestScore"])
    return best, trained[best], results


def main():
    raw_df = pd.read_csv("dataset.csv", low_memory=False)
    duplicate_audit(raw_df)

    # Encode labels and split before any learned preprocessing. The holdout
    # indices are retained only for reporting and final external evaluation.
    df = encode_labels(raw_df)
    X_dev, y_dev, X_sl_holdout, y_sl_holdout = create_sri_lankan_holdout(df)
    source_train = df.loc[X_dev.index].copy()
    sl_holdout = df.loc[X_sl_holdout.index].copy()

    train_df, temp_df = train_test_split(
        source_train,
        test_size=0.4,
        random_state=42,
        stratify=source_train["riskLabel"],
    )
    cal_df, val_df = train_test_split(
        temp_df,
        test_size=0.5,
        random_state=42,
        stratify=temp_df["riskLabel"],
    )
    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df["riskLabel"]
    X_cal = cal_df[FEATURE_COLUMNS]
    y_cal = cal_df["riskLabel"]
    X_val = val_df[FEATURE_COLUMNS]
    y_val = val_df["riskLabel"]

    # Robust model comparison uses development data only. The external
    # Sri Lankan holdout is not passed to CV, model selection, or tuning.
    ml_candidates = get_model_candidates()
    baseline_candidates = build_baseline_models()
    all_candidates = {**ml_candidates, **baseline_candidates}
    cv_results = compare_models_cv(X_train, y_train, all_candidates)
    cv_results_path = os.path.join(MODELS_DIR, "cv_results.json")
    with open(cv_results_path, "w", encoding="utf-8") as cv_file:
        json.dump(cv_results, cv_file, indent=2)

    best_cv_name = max(
        ml_candidates,
        key=lambda name: cv_results[name]["macroF1"]["mean"],
    )
    print("\nRepeated stratified CV summary (development data only):")
    print(f"{'Model':<20} {'Accuracy':>18} {'Macro F1':>18} {'Weighted F1':>18} {'ROC-AUC':>18}")
    print("-" * 96)
    for name, metrics in cv_results.items():
        def formatted(metric_name):
            metric = metrics[metric_name]
            if metric["mean"] is None:
                return "n/a"
            return f"{metric['mean']:.4f} +/- {metric['std']:.4f}"

        print(
            f"{name:<20} {formatted('accuracy'):>18} {formatted('macroF1'):>18} "
            f"{formatted('weightedF1'):>18} {formatted('rocAUC'):>18}"
        )
    print(f"Selected by repeated CV: {best_cv_name}")
    print(f"Saved repeated CV results to {cv_results_path}")

    baseline_results_path = os.path.join(MODELS_DIR, "baseline_results.json")
    with open(baseline_results_path, "w", encoding="utf-8") as baseline_file:
        json.dump(
            {
                "methodology": {
                    "protocol": "same 5-fold, 3-repeat development-only CV as ML candidates",
                    "externalHoldoutUsed": False,
                    "heuristic": "equal-weight standardized workHours + overtimeHours + stressLevel - sleepHours; fold-fitted quartile cut points",
                    "heuristicClinicalValidity": "not clinically validated; computational baseline only",
                },
                "models": {name: cv_results[name] for name in baseline_candidates},
            },
            baseline_file,
            indent=2,
        )
    print(f"Saved baseline results to {baseline_results_path}")

    # Paired bootstrap comparisons use only common internal development OOF
    # predictions. The Sri Lankan external holdout is never passed here.
    print("\nCalculating paired bootstrap comparisons on development OOF predictions...")
    candidate_predictions = {}
    for name, candidate in get_model_candidates().items():
        model = candidate[0] if isinstance(candidate, tuple) else candidate
        candidate_predictions[name] = collect_oof_predictions(model, X_train, y_train)

    bootstrap_results = {}
    baseline_name = "LogisticRegression"
    bootstrap_y, baseline_predictions, baseline_probabilities = candidate_predictions[baseline_name]
    for candidate_name, (_, predictions, probabilities) in candidate_predictions.items():
        if candidate_name == baseline_name:
            continue
        bootstrap_results[f"{baseline_name}_vs_{candidate_name}"] = {
            "macroF1": bootstrap_metric_ci(
                bootstrap_y, baseline_predictions, predictions, metric="macro_f1"
            ),
            "rocAUC": bootstrap_metric_ci(
                bootstrap_y, baseline_probabilities, probabilities, metric="roc_auc"
            ),
            "comparison": f"{baseline_name} - {candidate_name}",
            "evaluation": "common five-fold development out-of-fold predictions",
            "nBootstrap": 1000,
        }
    bootstrap_path = os.path.join(MODELS_DIR, "bootstrap_comparisons.json")
    with open(bootstrap_path, "w", encoding="utf-8") as bootstrap_file:
        json.dump(bootstrap_results, bootstrap_file, indent=2)
    print("\nPaired bootstrap comparison summary (development OOF only):")
    print(f"{'Comparison':<38} {'Metric':<10} {'Difference':>12} {'95% CI':>26}")
    print("-" * 90)
    for comparison, metrics in bootstrap_results.items():
        for metric_name, result in metrics.items():
            if metric_name not in {"macroF1", "rocAUC"}:
                continue
            print(
                f"{comparison:<38} {metric_name:<10} {result['observed_difference']:>12.4f} "
                f"[{result['ci_lower']:.4f}, {result['ci_upper']:.4f}]"
            )
    print(f"Saved bootstrap comparisons to {bootstrap_path}")

    # Final hyperparameter tuning still uses development data only, and its
    # preprocessing remains inside GridSearchCV's candidate pipeline.
    best_name, best_pipeline, results = fit_best_model(
        X_train,
        y_train,
        candidate_names=[best_cv_name],
    )
    calibrators = train_calibrator(best_pipeline, X_cal, y_cal)

    train_metrics = evaluate(best_pipeline, X_train, y_train)
    cal_metrics = evaluate(best_pipeline, X_cal, y_cal)
    val_metrics = evaluate(best_pipeline, X_val, y_val)

    holdout_metrics = None
    holdout_calibration = None
    if len(sl_holdout) > 0:
        X_hold = X_sl_holdout
        y_hold = y_sl_holdout
        # Never fit on this frame: it is transformed by the fitted development pipeline.
        assert set(X_hold.index).isdisjoint(set(X_train.index))
        holdout_metrics = evaluate(best_pipeline, X_hold, y_hold)
        holdout_calibration = calibration_report(best_pipeline, X_hold, y_hold)

    evaluation_results = {
        "classOrder": CLASS_ORDER,
        "internalEvaluation": val_metrics,
        "externalSriLankaEvaluation": holdout_metrics,
        "evaluationData": {
            "internal": "development final validation subset",
            "externalSriLanka": "held-out Sri Lankan subset, evaluated only after model fitting",
        },
    }
    evaluation_path = os.path.join(MODELS_DIR, "evaluation_results.json")
    with open(evaluation_path, "w", encoding="utf-8") as evaluation_file:
        json.dump(evaluation_results, evaluation_file, indent=2)
    print(f"Saved separate evaluation results to {evaluation_path}")

    calibrated_val = apply_calibrators(best_pipeline, calibrators, X_val)
    val_calibration = {
        "uncalibrated": calibration_report(best_pipeline, X_val, y_val),
        "calibrated": {
            "ece": float(np.mean([expected_calibration_error((y_val.to_numpy() == idx).astype(int), calibrated_val[:, idx]) for idx in range(len(RISK_LEVELS))])),
        },
    }

    existing = [f for f in os.listdir(MODELS_DIR) if f.startswith("model_v")]
    version_num = len(existing) + 1
    version = f"v2.{version_num}-{best_name.lower()}"

    model_file = f"model_{version}.pkl"
    scaler_file = f"scaler_{version}.pkl"
    calibrator_file = f"calibrator_{version}.pkl"

    best_model = best_pipeline.named_steps["model"]
    preprocessing = best_pipeline.named_steps["preprocessing"]
    joblib.dump(best_model, os.path.join(MODELS_DIR, model_file))
    joblib.dump(preprocessing, os.path.join(MODELS_DIR, scaler_file))
    joblib.dump(calibrators, os.path.join(MODELS_DIR, calibrator_file))

    X_train_transformed = preprocessing.transform(X_train)
    background_sample = X_train_transformed[:100] if len(X_train_transformed) >= 100 else X_train_transformed
    background_file = f"background_{version}.pkl"
    joblib.dump(background_sample, os.path.join(MODELS_DIR, background_file))

    global_feature_importance = compute_global_feature_importance(
        best_model,
        X_train_transformed[:200] if len(X_train_transformed) >= 200 else X_train_transformed,
        background_sample,
    )
    shap_results = compute_pipeline_shap_results(best_pipeline, X_val, local_rows=3)
    shap_results["model"] = best_name
    shap_results["data"] = "internal development validation subset"
    shap_results["stability"] = compute_shap_stability(best_pipeline, X_train, y_train)
    shap_path = os.path.join(MODELS_DIR, "shap_results.json")
    with open(shap_path, "w", encoding="utf-8") as shap_file:
        json.dump(shap_results, shap_file, indent=2)
    print(f"Saved SHAP results to {shap_path}")

    metadata = {
        "version": version,
        "algorithm": best_name,
        "modelFile": model_file,
        "scalerFile": scaler_file,
        "calibratorFile": calibrator_file,
        "backgroundFile": background_file,
        "featureColumns": FEATURE_COLUMNS,
        "riskLevels": CLASS_ORDER,
        "classOrder": CLASS_ORDER,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "training": train_metrics,
            "calibration": cal_metrics,
            "finalValidation": val_metrics,
        },
        "validation": {
            "internalTraining": train_metrics,
            "internalCalibration": cal_metrics,
            "internalFinalValidation": val_metrics,
            "calibration": val_calibration,
            "externalSriLanka": holdout_metrics,
            "internalEvaluation": val_metrics,
            "externalSriLankaEvaluation": holdout_metrics,
            "externalSriLankaCalibration": holdout_calibration,
            "domainShift": domain_shift_report(source_train, sl_holdout) if len(sl_holdout) > 0 else {},
        },
        "dataSplits": {
            "trainingRows": int(len(train_df)),
            "calibrationRows": int(len(cal_df)),
            "finalValidationRows": int(len(val_df)),
            "externalSriLankaRows": int(len(sl_holdout)),
        },
        "globalFeatureImportance": global_feature_importance,
        "status": "Active",
    }

    with open(os.path.join(MODELS_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved model bundle {version} to {MODELS_DIR}")


if __name__ == "__main__":
    main()
