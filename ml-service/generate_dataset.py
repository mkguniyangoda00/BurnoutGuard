"""
generate_dataset.py

Builds dataset.csv from harmonized_base.csv.

Preferred path:
  - use harmonized_risk_norm directly as the supervised signal
  - quantile-bin it into the four risk bands used by the app
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

def fill_synthetic_column(col, n):
    lo, hi = FEATURE_RANGES[col]
    if float(lo).is_integer() and float(hi).is_integer():
        return np.random.randint(int(lo), int(hi) + 1, size=n)
    return np.random.uniform(lo, hi, size=n)


def quantile_label(values):
    series = pd.Series(values).astype(float)
    if series.isnull().any():
        raise ValueError("harmonized_risk_norm contains missing values after cleaning.")
    try:
        bins = pd.qcut(series, 4, labels=["Low", "Moderate", "High", "Critical"])
        return bins.astype(str).tolist()
    except ValueError:
        ranked = series.rank(method="first")
        bins = pd.qcut(ranked, 4, labels=["Low", "Moderate", "High", "Critical"])
        return bins.astype(str).tolist()


def main():
    base = pd.read_csv(HARMONIZED_PATH)
    n = len(base)
    print(f"Loaded {n} harmonized base rows.")

    df = pd.DataFrame(index=base.index)

    if "harmonized_risk_norm" not in base.columns:
        raise ValueError(
            "harmonized_base.csv is missing required column 'harmonized_risk_norm'. "
            "Run ml-service/harmonize_datasets.py first."
        )

    label_source = pd.to_numeric(base["harmonized_risk_norm"], errors="coerce")
    valid_mask = label_source.notna()
    if not valid_mask.any():
        raise ValueError(
            "No valid harmonized_risk_norm values found in harmonized_base.csv. "
            "Rows without a valid target cannot be used for supervised dataset generation."
        )
    if valid_mask.sum() != len(base):
        dropped = len(base) - int(valid_mask.sum())
        print(f"Dropping {dropped} rows with missing harmonized_risk_norm before label generation.")
    base = base.loc[valid_mask].copy()
    label_source = label_source.loc[valid_mask].reset_index(drop=True)
    n = len(base)
    df = pd.DataFrame(index=base.index)

    for col in FEATURE_RANGES:
        if col in base.columns and base[col].notna().any():
            real_values = base[col].to_numpy(dtype=np.float64, copy=True)
            missing_mask = np.isnan(real_values)
            if missing_mask.any():
                synthetic_fill = fill_synthetic_column(col, n)
                real_values[missing_mask] = synthetic_fill[missing_mask]
            df[col] = real_values
        else:
            df[col] = fill_synthetic_column(col, n)

    if "afterHoursMessaging" in base.columns and base["afterHoursMessaging"].notna().any():
        real_bool = base["afterHoursMessaging"].to_numpy(dtype=np.float64, copy=True)
        missing_mask = np.isnan(real_bool)
        synthetic_bool = (np.random.rand(n) < 0.35).astype(float)
        real_bool[missing_mask] = synthetic_bool[missing_mask]
        df["afterHoursMessaging"] = real_bool.astype(int)
    else:
        df["afterHoursMessaging"] = (np.random.rand(n) < 0.35).astype(int)

    df["isWeekendWork"] = (np.random.rand(n) < 0.15).astype(int)
    df["isOnCallToday"] = (np.random.rand(n) < 0.10).astype(int)

    df["riskLevel"] = quantile_label(label_source.to_numpy(dtype=float, copy=False))
    df["harmonized_risk_norm"] = label_source.to_numpy(dtype=float, copy=False)
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
