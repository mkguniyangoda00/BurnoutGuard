"""
BurnoutGuard - evaluation pipeline
==================================
Run this end-to-end to:
  1. Evaluate the public corpus using 5-fold stratified cross-validation
  2. Fit the final model on the full public corpus for artifact export
  3. Build a composite exhaustion proxy label from the 314-person survey
  4. Map the survey's available columns onto the training feature schema
  5. Evaluate the trained model on the real 314-person holdout as a
     feasibility and rank-order validation study

Inputs expected:
  - dataset.csv
  - Untitled_form.csv

Outputs:
  - model.pkl, scaler.pkl, feature_cols.pkl, train_medians.pkl
"""

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler

DATASET_PATH = "dataset.csv"
SURVEY_PATH = "Untitled_form.csv"
RISK_LABELS = ["Low", "Moderate", "High", "Critical"]
LABEL_MAP = {"Low": 0, "Moderate": 1, "High": 2, "Critical": 3}


def evaluate_fold(model, X_train, y_train, X_test, y_test):
    scaler = StandardScaler().fit(X_train)
    X_train_s = scaler.transform(X_train)
    X_test_s = scaler.transform(X_test)
    model.fit(X_train_s, y_train)
    pred = model.predict(X_test_s)
    proba = model.predict_proba(X_test_s)
    return {
        "weighted_f1": f1_score(y_test, pred, average="weighted"),
        "macro_auc": roc_auc_score(y_test, proba, multi_class="ovr", average="macro"),
    }


def main():
    df = pd.read_csv(DATASET_PATH)
    df["y"] = df["riskLevel"].map(LABEL_MAP)
    feature_cols = [c for c in df.columns if c not in ("riskLevel", "y")]
    X = df[feature_cols].values
    y = df["y"].values

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
                X[train_idx],
                y[train_idx],
                X[test_idx],
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

    scaler = StandardScaler().fit(X)
    X_scaled = scaler.transform(X)
    best_model = LogisticRegression(max_iter=2000, C=best_c, random_state=42).fit(X_scaled, y)

    train_medians = pd.DataFrame(X, columns=feature_cols).median()
    joblib.dump(best_model, "model.pkl")
    joblib.dump(scaler, "scaler.pkl")
    joblib.dump(feature_cols, "feature_cols.pkl")
    joblib.dump(train_medians, "train_medians.pkl")
    print("\nSaved model.pkl / scaler.pkl / feature_cols.pkl / train_medians.pkl")

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
    for c in feature_cols:
        X_holdout[c] = train_medians[c]

    X_holdout["sleepHours"] = survey["Average sleep hours per night"]
    X_holdout["workHours"] = survey["Average working hours per day"]
    X_holdout["sprintPressureRating"] = survey["Sprint/deadline pressure"]
    X_holdout["contextSwitchingFrequency"] = survey["Frequency of context switching between tasks"]
    X_holdout["overtimeHours"] = (survey["Average overtime hours per week"] / 5).clip(0, 8)
    X_holdout["urgentTasksCount"] = (survey["Number of urgent/unplanned tasks per week"] - 1) / 4 * 10
    X_holdout["emotionalFatigue"] = 1 + (survey["How often are you emotionally exhausted?"] - 1) / 4 * 9
    X_holdout["stressLevel"] = 1 + (survey["exhaustion_composite"] - 1) / 4 * 9
    X_holdout["anxietyLevel"] = 1 + (survey['How often do you think "I can\'t take it anymore"?'] - 1) / 4 * 9

    X_holdout = X_holdout[feature_cols].astype(float)
    X_scaled = scaler.transform(X_holdout.values)
    y_true = survey["y_proxy"].values
    y_pred = best_model.predict(X_scaled)
    y_proba = best_model.predict_proba(X_scaled)

    print(f"\n=== REAL SRI LANKAN FEASIBILITY AND RANK-ORDER VALIDATION STUDY (N={len(survey)}) ===")
    print(f"Accuracy:      {accuracy_score(y_true, y_pred):.4f}")
    print(f"Weighted F1:   {f1_score(y_true, y_pred, average='weighted'):.4f}")
    print(f"Macro ROC-AUC: {roc_auc_score(y_true, y_proba, multi_class='ovr', average='macro'):.4f}")
    precision, recall, f1, support = precision_recall_fscore_support(y_true, y_pred, labels=[0, 1, 2, 3], zero_division=0)
    for idx, label in enumerate(RISK_LABELS):
        print(f"  {label}: precision={precision[idx]:.4f}, recall={recall[idx]:.4f}, f1={f1[idx]:.4f}, support={support[idx]}")
    print(f"\nNote: only 9 of {len(feature_cols)} features were directly observed in the survey;")
    print("the remaining features were median-imputed from the training set for this feasibility analysis.")


if __name__ == "__main__":
    main()
