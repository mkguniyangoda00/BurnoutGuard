"""
generate_dataset.py

Builds dataset.csv from harmonized_base.csv with leakage-resistant labels.
Labels are generated from observable feature patterns, not from any burnout
score column or target-derived proxy.
"""

import os

import numpy as np
import pandas as pd

np.random.seed(42)

HARMONIZED_PATH = "harmonized_base.csv"
OUTPUT_PATH = "dataset.csv"
SL_HOLDOUT_PATH = "raw_datasets/sri_lankan_developer_burnout.csv"

FEATURE_RANGES = {
    "sleepHours": (0, 12), "sleepQuality": (1, 5), "exerciseLevel": (1, 5),
    "screenTimeHours": (0, 14), "workHours": (0, 14), "workloadRating": (1, 5),
    "overtimeHours": (0, 8), "breaksTaken": (0, 10), "commuteMinutes": (0, 180),
    "stressLevel": (1, 10), "moodScore": (1, 10), "energyLevel": (1, 5),
    "workSatisfaction": (1, 5), "caffeineIntake": (0, 8), "mealQuality": (1, 5),
    "socialSupportLevel": (1, 5), "anxietyLevel": (1, 10), "emotionalFatigue": (1, 10),
    "motivationLevel": (1, 5), "concentrationIssues": (1, 5), "irritabilityLevel": (1, 5),
    "lonelinessLevel": (1, 5), "selfEfficacy": (1, 5), "copingAbility": (1, 5),
    "powerInternetDisruption": (1, 5), "wfhEnvironmentQuality": (1, 5),
    "familyResponsibilityLoad": (1, 5), "salaryWorkloadSatisfaction": (1, 5),
    "meetingsCount": (0, 10), "urgentTasksCount": (0, 10),
    "sprintPressureRating": (1, 5), "deadlineFrequency": (1, 5),
    "bugFixingLoad": (1, 5), "contextSwitchingFrequency": (1, 5),
    "workModeEncoded": (1, 3),
    "managerSupportLevel": (1, 5), "peerSupportLevel": (1, 5),
    "autonomyLevel": (1, 5), "roleAmbiguity": (1, 5),
    "taskComplexity": (1, 5), "interruptionsPerDay": (0, 20),
}

WEIGHTS = {
    "sleepHours": -1.4, "sleepQuality": -1.0, "exerciseLevel": -0.5,
    "screenTimeHours": 0.5, "workHours": 0.9, "workloadRating": 0.8,
    "overtimeHours": 1.1, "breaksTaken": -0.4, "commuteMinutes": 0.3,
    "stressLevel": 1.3, "moodScore": -1.0, "energyLevel": -0.5,
    "workSatisfaction": -0.6, "caffeineIntake": 0.3, "mealQuality": -0.3,
    "socialSupportLevel": -0.6, "anxietyLevel": 1.1, "emotionalFatigue": 1.2,
    "motivationLevel": -0.5, "concentrationIssues": 0.4, "irritabilityLevel": 0.4,
    "lonelinessLevel": 0.5, "selfEfficacy": -0.5, "copingAbility": -0.5,
    "powerInternetDisruption": 0.4, "wfhEnvironmentQuality": -0.4,
    "familyResponsibilityLoad": 0.3, "salaryWorkloadSatisfaction": -0.4,
    "meetingsCount": 0.6, "urgentTasksCount": 0.7,
    "sprintPressureRating": 0.9, "deadlineFrequency": 0.7,
    "bugFixingLoad": 0.5, "contextSwitchingFrequency": 0.6,
    "workModeEncoded": 0.2,
    "managerSupportLevel": -0.7,
    "peerSupportLevel": -0.5,
    "autonomyLevel": -0.6,
    "roleAmbiguity": 0.6,
    "taskComplexity": 0.5,
    "interruptionsPerDay": 0.6,
}


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def fill_synthetic_column(col, n, proxy):
    lo, hi = FEATURE_RANGES[col]
    weight = WEIGHTS.get(col, 0)
    midpoint = (lo + hi) / 2
    span = (hi - lo) / 2
    direction = 1 if weight > 0 else -1
    shift = direction * (proxy - 0.5) * span * 1.2
    noise = np.random.normal(0, span * 0.25, n)
    values = midpoint + shift + noise
    return np.clip(values, lo, hi)


def main():
    base = pd.read_csv(HARMONIZED_PATH)
    n = len(base)
    print(f"Loaded {n} harmonized base rows.")

    df = pd.DataFrame(index=base.index)

    observed_proxy = np.zeros(n)
    for col, weight in WEIGHTS.items():
        if col in base.columns:
            series = pd.to_numeric(base[col], errors="coerce")
            fallback = series.median() if series.notna().any() else 0
            filled = series.fillna(fallback)
            lo, hi = FEATURE_RANGES[col]
            observed_proxy += weight * ((filled - lo) / (hi - lo))
    observed_proxy = sigmoid(observed_proxy)

    for col in FEATURE_RANGES:
        if col in base.columns and base[col].notna().any():
            real_values = base[col].to_numpy(dtype=np.float64, copy=True)
            missing_mask = np.isnan(real_values)
            if missing_mask.any():
                synthetic_fill = fill_synthetic_column(col, n, observed_proxy)
                real_values[missing_mask] = synthetic_fill[missing_mask]
            df[col] = real_values
        else:
            df[col] = fill_synthetic_column(col, n, observed_proxy)

    if "afterHoursMessaging" in base.columns and base["afterHoursMessaging"].notna().any():
        real_bool = base["afterHoursMessaging"].to_numpy(dtype=np.float64, copy=True)
        missing_mask = np.isnan(real_bool)
        synthetic_bool = (np.random.rand(n) < (0.25 + 0.4 * observed_proxy)).astype(float)
        real_bool[missing_mask] = synthetic_bool[missing_mask]
        df["afterHoursMessaging"] = real_bool.astype(int)
    else:
        df["afterHoursMessaging"] = (np.random.rand(n) < (0.25 + 0.4 * observed_proxy)).astype(int)

    df["isWeekendWork"] = (np.random.rand(n) < (0.15 + 0.35 * observed_proxy)).astype(int)
    df["isOnCallToday"] = (np.random.rand(n) < (0.10 + 0.30 * observed_proxy)).astype(int)

    feature_score_raw = np.zeros(n)
    for col, weight in WEIGHTS.items():
        lo, hi = FEATURE_RANGES[col]
        normalized = (df[col] - lo) / (hi - lo)
        feature_score_raw += weight * normalized
    feature_score_raw += 0.4 * df["afterHoursMessaging"]
    feature_score_raw += 0.35 * df["isWeekendWork"]
    feature_score_raw += 0.45 * df["isOnCallToday"]
    feature_score_raw += 0.2 * (df["interruptionsPerDay"] / 20)

    final_risk = sigmoid(feature_score_raw)
    final_risk = 0.85 * final_risk + 0.15 * np.random.uniform(0, 1, n)
    final_risk = np.clip(final_risk, 0, 1)

    q1, q2, q3 = np.quantile(final_risk, [0.25, 0.5, 0.75])

    def label(x):
        if x < q1:
            return "Low"
        if x < q2:
            return "Moderate"
        if x < q3:
            return "High"
        return "Critical"

    df["riskLevel"] = [label(x) for x in final_risk]
    df["source_dataset"] = base.get("source_dataset", "harmonized_base")

    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved {len(df)} rows to {OUTPUT_PATH}")
    print(df["riskLevel"].value_counts())

    if os.path.exists(SL_HOLDOUT_PATH):
        sl = pd.read_csv(SL_HOLDOUT_PATH)
        sl["source_dataset"] = "sri_lankan_developer_burnout"
        sl.to_csv("sri_lankan_developer_holdout.csv", index=False)
        print("Prepared Sri Lankan holdout at sri_lankan_developer_holdout.csv")


if __name__ == "__main__":
    main()
