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
from sklearn.model_selection import GridSearchCV
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, brier_score_loss, f1_score, log_loss, precision_recall_fscore_support, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize
from xgboost import XGBClassifier

from preprocess import FEATURE_COLUMNS, MODELS_DIR, RISK_LEVELS, encode_labels, load_dataset, source_split
from explain import compute_global_feature_importance

os.makedirs(MODELS_DIR, exist_ok=True)
EXPERIMENTS_DIR = os.path.join(os.path.dirname(__file__), "experiments", "results")
os.makedirs(EXPERIMENTS_DIR, exist_ok=True)

SOURCE_TARGET = "sri_lankan_developer_burnout"


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
    precision, recall, f1, support = precision_recall_fscore_support(y, y_pred, labels=list(range(len(RISK_LEVELS))), zero_division=0)
    return {
        "accuracy": float(accuracy_score(y, y_pred)),
        "f1Score": float(f1_score(y, y_pred, average="weighted")),
        "macroAuc": float(roc_auc_score(y, y_proba, multi_class="ovr")),
        "logLoss": float(log_loss(y, y_proba)),
        "precisionPerClass": [float(x) for x in precision],
        "recallPerClass": [float(x) for x in recall],
        "f1PerClass": [float(x) for x in f1],
        "supportPerClass": [int(x) for x in support],
        "macroPrecision": float(np.mean(precision)),
        "macroRecall": float(np.mean(recall)),
        "macroF1": float(np.mean(f1)),
    }


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


def fit_best_model(X_train, y_train):
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
        search = GridSearchCV(model, param_grid, scoring="f1_weighted", cv=2, n_jobs=-1, verbose=1)
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
    raw_df = pd.read_csv("dataset.csv")
    duplicate_audit(raw_df)

    df = encode_labels(load_dataset("dataset.csv"))
    source_train, sl_holdout = source_split(df, SOURCE_TARGET)

    if len(sl_holdout) == 0:
        print("No Sri Lankan holdout source found in dataset; using source-aware internal split only.")

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

    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_cal_scaled = scaler.transform(X_cal)
    X_val_scaled = scaler.transform(X_val)

    best_name, best_model, results = fit_best_model(X_train_scaled, y_train)
    calibrators = train_calibrator(best_model, X_cal_scaled, y_cal)

    train_metrics = evaluate(best_model, X_train_scaled, y_train)
    cal_metrics = evaluate(best_model, X_cal_scaled, y_cal)
    val_metrics = evaluate(best_model, X_val_scaled, y_val)

    holdout_metrics = None
    holdout_calibration = None
    if len(sl_holdout) > 0:
        X_hold = sl_holdout[FEATURE_COLUMNS]
        y_hold = sl_holdout["riskLabel"]
        X_hold_scaled = scaler.transform(X_hold)
        holdout_metrics = evaluate(best_model, X_hold_scaled, y_hold)
        holdout_calibration = calibration_report(best_model, X_hold_scaled, y_hold)

    calibrated_val = apply_calibrators(best_model, calibrators, X_val_scaled)
    val_calibration = {
        "uncalibrated": calibration_report(best_model, X_val_scaled, y_val),
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

    joblib.dump(best_model, os.path.join(MODELS_DIR, model_file))
    joblib.dump(scaler, os.path.join(MODELS_DIR, scaler_file))
    joblib.dump(calibrators, os.path.join(MODELS_DIR, calibrator_file))

    background_sample = X_train_scaled[:100] if len(X_train_scaled) >= 100 else X_train_scaled
    background_file = f"background_{version}.pkl"
    joblib.dump(background_sample, os.path.join(MODELS_DIR, background_file))

    global_feature_importance = compute_global_feature_importance(
        best_model,
        X_train_scaled[:200] if len(X_train_scaled) >= 200 else X_train_scaled,
        background_sample,
    )

    metadata = {
        "version": version,
        "algorithm": best_name,
        "modelFile": model_file,
        "scalerFile": scaler_file,
        "calibratorFile": calibrator_file,
        "backgroundFile": background_file,
        "featureColumns": FEATURE_COLUMNS,
        "riskLevels": RISK_LEVELS,
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
