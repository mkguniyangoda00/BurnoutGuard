"""DEPRECATED secondary sanity check; ``train.py`` is authoritative.

This script must not be used to produce research results. It intentionally
differs from the authoritative pipeline in train.py:

* it evaluates only Logistic Regression with a single 5-fold CV pass;
* train.py compares all candidates with 5-fold, 3-repeat CV and selects the
    final model using development data only;
* its Sri Lankan output uses a locally quartile-binned six-item exhaustion
    proxy over all 314 survey responses, not train.py's 63-row held-out subset;
* that proxy and its metrics are not interchangeable with train.py's
    ``externalSriLankaEvaluation`` and must not be reported as the research
    evaluation.

The script is retained only as a manually requested, secondary feasibility
check. Run ``python train.py`` for the authoritative training, validation,
calibration, SHAP, and saved-artifact pipeline.
"""

import numpy as np
import pandas as pd
import sys
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, roc_auc_score
from sklearn.model_selection import StratifiedKFold
from train import build_preprocessing_pipeline
from preprocess import FEATURE_COLUMNS

DATASET_PATH = "dataset.csv"
SURVEY_PATH = "raw_datasets/sri_lankan_developer_burnout.csv"
RISK_LABELS = ["Low", "Moderate", "High", "Critical"]
LABEL_MAP = {"Low": 0, "Moderate": 1, "High": 2, "Critical": 3}


def evaluate_fold(model, X_train, y_train, X_test, y_test):
    pipeline = build_preprocessing_pipeline(model)
    pipeline.fit(X_train, y_train)
    pred = pipeline.predict(X_test)
    proba = pipeline.predict_proba(X_test)
    return {
        "weighted_f1": f1_score(y_test, pred, average="weighted"),
        "macro_auc": roc_auc_score(y_test, proba, multi_class="ovr", average="macro"),
    }


def main():
    if "--secondary-sanity-check" not in sys.argv:
        print(
            "DEPRECATED: train.py is the authoritative BurnoutGuard research pipeline.\n"
            "This script uses a different proxy target and is not comparable to\n"
            "the primary Sri Lankan held-out evaluation.\n"
            "To run it intentionally, pass --secondary-sanity-check."
        )
        return

    print(
        "WARNING: Running deprecated secondary sanity check only. Results must not\n"
        "be mixed with train.py research metrics or reported as the primary evaluation."
    )
    df = pd.read_csv(DATASET_PATH, low_memory=False)
    df["y"] = df["riskLevel"].map(LABEL_MAP)
    feature_cols = FEATURE_COLUMNS
    public_df = df[df["source_dataset"].astype(str).str.lower() != "sri_lankan_developer_burnout"]
    X = public_df[feature_cols]
    y = public_df["y"].values

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    candidate_cs = [0.01, 0.1, 1.0, 10.0]
    cv_summary = {}

    print("=== PUBLIC-CORPUS 5-FOLD STRATIFIED CROSS-VALIDATION ===")
    for C in candidate_cs:
        fold_f1 = []
        fold_auc = []
        for train_idx, test_idx in skf.split(X, y):
            fold = evaluate_fold(
                LogisticRegression(max_iter=2000, C=C, random_state=42),
                X.iloc[train_idx],
                y[train_idx],
                X.iloc[test_idx],
                y[test_idx],
            )
            fold_f1.append(fold["weighted_f1"])
            fold_auc.append(fold["macro_auc"])
        cv_summary[C] = {"f1": fold_f1, "auc": fold_auc}
        print(
            f"  C={C}: weighted F1 = {np.mean(fold_f1):.4f} ± {np.std(fold_f1, ddof=1):.4f}, "
            f"ROC-AUC = {np.mean(fold_auc):.4f} ± {np.std(fold_auc, ddof=1):.4f}"
        )

    best_c = max(candidate_cs, key=lambda c: np.mean(cv_summary[c]["f1"]))
    print(f"\nSelected C={best_c} using 5-fold cross-validation.")
    print(
        f"Regularized Logistic Regression achieved a mean weighted F1-score of "
        f"{np.mean(cv_summary[best_c]['f1']):.3f} ± {np.std(cv_summary[best_c]['f1'], ddof=1):.3f} "
        f"and ROC-AUC of {np.mean(cv_summary[best_c]['auc']):.3f} ± {np.std(cv_summary[best_c]['auc'], ddof=1):.3f}."
    )

    secondary_pipeline = build_preprocessing_pipeline(
        LogisticRegression(max_iter=2000, C=best_c, random_state=42)
    )
    secondary_pipeline.fit(X, y)
    best_model = secondary_pipeline

    survey = pd.read_csv(SURVEY_PATH)
    survey.columns = [c.strip() for c in survey.columns]

    exhaustion_items = [
        "How often do you feel tired?",
        "How often are you physically exhausted?",
        "How often are you emotionally exhausted?",
        'How often do you think "I can\'t take it anymore"?',
        "How often do you feel worn out?",
        "How often do you feel weak and susceptible to illness?",
    ]
    survey["exhaustion_composite"] = survey[exhaustion_items].mean(axis=1)
    survey["y_proxy"] = pd.qcut(survey["exhaustion_composite"], 4, labels=[0, 1, 2, 3]).astype(int)

    X_holdout = pd.DataFrame(index=survey.index, columns=feature_cols, dtype=float)

    X_holdout["sleepHours"] = survey["Average sleep hours per night"]
    X_holdout["workHours"] = survey["Average working hours per day"]
    X_holdout["sprintPressureRating"] = survey["Sprint/deadline pressure"]
    X_holdout["contextSwitchingFrequency"] = survey["Frequency of context switching between tasks"]
    X_holdout["overtimeHours"] = (survey["Average overtime hours per week"] / 5).clip(0, 8)
    X_holdout["urgentTasksCount"] = (survey["Number of urgent/unplanned tasks per week"] - 1) / 4 * 10
    # Do not map exhaustion items into predictors: they define y_proxy and
    # would make this secondary check target leakage by construction.

    X_holdout = X_holdout[feature_cols].astype(float)
    y_true = survey["y_proxy"].values
    y_pred = best_model.predict(X_holdout)
    y_proba = best_model.predict_proba(X_holdout)

    print(f"\n=== REAL SRI LANKAN FEASIBILITY AND RANK-ORDER VALIDATION STUDY (N={len(survey)}) ===")
    print(f"Accuracy:      {accuracy_score(y_true, y_pred):.4f}")
    print(f"Weighted F1:   {f1_score(y_true, y_pred, average='weighted'):.4f}")
    print(f"Macro ROC-AUC: {roc_auc_score(y_true, y_proba, multi_class='ovr', average='macro'):.4f}")
    precision, recall, f1, support = precision_recall_fscore_support(y_true, y_pred, labels=[0, 1, 2, 3], zero_division=0)
    for idx, label in enumerate(RISK_LABELS):
        print(f"  {label}: precision={precision[idx]:.4f}, recall={recall[idx]:.4f}, f1={f1[idx]:.4f}, support={support[idx]}")
    print(f"\nNote: only 7 of {len(feature_cols)} features were directly observed in the survey;")
    print("the remaining features were imputed by the fitted public-corpus pipeline.")


if __name__ == "__main__":
    main()
