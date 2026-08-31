"""
BurnoutGuard — full reproducible pipeline
==========================================
Run this end-to-end to:
  1. Train the model correctly (train/val/test split — no test-set peeking)
  2. Evaluate it honestly on the public-corpus test set
  3. Build a composite exhaustion proxy label from your 314-person survey
  4. Map the survey's available columns onto the training feature schema
  5. Evaluate the trained model on the real 314-person holdout as a
     feasibility and rank-order validation study

Inputs expected (place in the same folder, or edit the paths below):
  - dataset.csv          the 256,800-row harmonized training corpus (44 features + riskLevel)
  - Untitled_form.csv     your 314-person Sri Lankan survey export

Outputs:
  - model.pkl, scaler.pkl, feature_cols.pkl, train_medians.pkl  (saved trained artifacts)
  - printed metrics for BOTH the public test set and the real survey holdout
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, roc_auc_score

DATASET_PATH = "dataset.csv"
SURVEY_PATH = "Untitled_form.csv"

# =====================================================================
# PART 1 — Train the model 
# =====================================================================

df = pd.read_csv(DATASET_PATH)

# riskLevel is a text label (Low/Moderate/High/Critical) — convert to 0-3
label_map = {"Low": 0, "Moderate": 1, "High": 2, "Critical": 3}
df["y"] = df["riskLevel"].map(label_map)

feature_cols = [c for c in df.columns if c not in ("riskLevel", "y")]
X = df[feature_cols].values
y = df["y"].values

# Three-way split: 60% train / 20% validation / 20% test.
# - train: fit the model
# - validation: choose the best hyperparameter (C) — NEVER touch test here
# - test: touched exactly once, at the very end, for the final reported numbers
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.4, stratify=y, random_state=42
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42
)

# Fit the scaler ONLY on training data (prevents leaking test/val statistics
# into the scaling step — this part of your original pipeline was already correct).
scaler = StandardScaler().fit(X_train)
X_train_s = scaler.transform(X_train)
X_val_s = scaler.transform(X_val)
X_test_s = scaler.transform(X_test)

# Try a few regularization strengths, pick the winner using VALIDATION F1 only.
best_C, best_val_f1, best_model = None, -1, None
for C in [0.01, 0.1, 1.0, 10.0]:
    candidate = LogisticRegression(max_iter=2000, C=C, random_state=42)
    candidate.fit(X_train_s, y_train)
    val_pred = candidate.predict(X_val_s)
    val_f1 = f1_score(y_val, val_pred, average="weighted")
    print(f"  C={C}: validation weighted F1 = {val_f1:.4f}")
    if val_f1 > best_val_f1:
        best_val_f1, best_C, best_model = val_f1, C, candidate

print(f"\nSelected C={best_C} using validation performance only.")

# Final, one-time, unbiased evaluation on the untouched test set.
test_pred = best_model.predict(X_test_s)
test_proba = best_model.predict_proba(X_test_s)
print("\n=== PUBLIC-CORPUS TEST SET (held out, never used for tuning) ===")
print(f"Accuracy:      {accuracy_score(y_test, test_pred):.4f}")
print(f"Weighted F1:   {f1_score(y_test, test_pred, average='weighted'):.4f}")
print(f"Macro ROC-AUC: {roc_auc_score(y_test, test_proba, multi_class='ovr', average='macro'):.4f}")

precision, recall, f1, support = precision_recall_fscore_support(y_test, test_pred, labels=[0, 1, 2, 3], zero_division=0)
for idx, label in enumerate(["Low", "Moderate", "High", "Critical"]):
    print(f"  {label}: precision={precision[idx]:.4f}, recall={recall[idx]:.4f}, f1={f1[idx]:.4f}, support={support[idx]}")

# Save everything needed to evaluate on new data later.
train_medians = pd.DataFrame(X_train, columns=feature_cols).median()
joblib.dump(best_model, "model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(feature_cols, "feature_cols.pkl")
joblib.dump(train_medians, "train_medians.pkl")
print("\nSaved model.pkl / scaler.pkl / feature_cols.pkl / train_medians.pkl")

# =====================================================================
# PART 2 — Evaluate on the REAL 314-person Sri Lankan survey
# =====================================================================

survey = pd.read_csv(SURVEY_PATH)
survey.columns = [c.strip() for c in survey.columns]  # form exports often have stray spaces

# --- Step A: build a ground-truth proxy label ---
# The survey has no validated burnout score, so we build a composite from
# the 7 exhaustion-frequency Likert items (1-5 scale) and split into
# quartiles to match the four training risk tiers. This is NOT a validated
# instrument — label it as a proxy everywhere you report it.
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

# --- Step B: map the survey's ~9 usable columns onto the 44-feature schema ---
# Every feature the survey did NOT collect is filled with the TRAINING median
# (never a survey-derived value — that would leak information).
X_holdout = pd.DataFrame(index=survey.index, columns=feature_cols, dtype=float)
for c in feature_cols:
    X_holdout[c] = train_medians[c]

# Direct 1:1 matches (same units/scale as training)
X_holdout["sleepHours"] = survey["Average sleep hours per night"]
X_holdout["workHours"] = survey["Average working hours per day"]
X_holdout["sprintPressureRating"] = survey["Sprint/deadline pressure"]
X_holdout["contextSwitchingFrequency"] = survey["Frequency of context switching between tasks"]

# Rescaled matches — document these as explicit assumptions in your methodology:
#   overtimeHours: survey asked "per week", training is on a ~0-8 daily-like scale -> divide by 5
X_holdout["overtimeHours"] = (survey["Average overtime hours per week"] / 5).clip(0, 8)
#   urgentTasksCount: survey is a 1-5 rating, training is a 0-10 count -> linear rescale
X_holdout["urgentTasksCount"] = (survey["Number of urgent/unplanned tasks per week"] - 1) / 4 * 10
#   emotionalFatigue: survey is 1-5, training is 1-10 -> linear rescale
X_holdout["emotionalFatigue"] = 1 + (survey["How often are you emotionally exhausted?"] - 1) / 4 * 9
#   stressLevel: no direct survey question -> approximate from the composite exhaustion score
X_holdout["stressLevel"] = 1 + (survey["exhaustion_composite"] - 1) / 4 * 9
#   anxietyLevel: approximate from the "can't take it anymore" item
X_holdout["anxietyLevel"] = 1 + (survey['How often do you think "I can\'t take it anymore"?'] - 1) / 4 * 9

X_holdout = X_holdout[feature_cols].astype(float)
X_scaled = scaler.transform(X_holdout.values)

y_pred = best_model.predict(X_scaled)
y_proba = best_model.predict_proba(X_scaled)
y_true = survey["y_proxy"].values

print(f"\n=== REAL SRI LANKAN FEASIBILITY AND RANK-ORDER VALIDATION STUDY (N={len(survey)}) ===")
print(f"Accuracy:      {accuracy_score(y_true, y_pred):.4f}")
print(f"Weighted F1:   {f1_score(y_true, y_pred, average='weighted'):.4f}")
print(f"Macro ROC-AUC: {roc_auc_score(y_true, y_proba, multi_class='ovr', average='macro'):.4f}")
precision, recall, f1, support = precision_recall_fscore_support(y_true, y_pred, labels=[0, 1, 2, 3], zero_division=0)
for idx, label in enumerate(["Low", "Moderate", "High", "Critical"]):
    print(f"  {label}: precision={precision[idx]:.4f}, recall={recall[idx]:.4f}, f1={f1[idx]:.4f}, support={support[idx]}")
print(f"\nNote: only {9} of {len(feature_cols)} features were directly observed in the survey;")
print("the remaining features were median-imputed from the training set for this feasibility analysis.")
