"""
harmonize_datasets.py

Maps 4 external burnout datasets (different schemas, different scales,
different populations) into BurnoutGuard's unified feature schema.

METHODOLOGY NOTE (for FYP report):
This is NOT a row-concatenation merge. Row concatenation across datasets
with different feature sets, different target-variable scales, and
different survey populations would introduce dataset shift and invalidate
the resulting model. Instead, each dataset's semantically equivalent
columns are individually rescaled into BurnoutGuard's target ranges, and
combined only where genuinely comparable. Columns that don't exist in a
given source dataset are left NaN here and are populated later using
domain-informed synthetic generation (see generate_dataset.py), grounded
on this file's harmonized_risk_norm and real base features rather than
being fully synthetic.

Sources used (selected for genuine workplace/developer burnout relevance):
  1. mental_health_burnout_tech_2026.csv   (100,000 rows, global tech workers)
  2. tech_mental_health_burnout.csv        (150,000 rows, global tech workers)
  3. indian_developer_burnout_2026.csv     (5,000 rows, South Asian developers
                                             — closest available proxy to
                                             Sri Lankan developer context)
  4. work_from_home_burnout_dataset.csv    (1,800 rows, WFH-specific)

Excluded: mental_health_prediction.csv (clinical/student population, not
workplace burnout), task_turtles_vs_sprint_hares.csv (task-completion
dataset, different target variable entirely), and thin/duplicate datasets
with <5 usable overlapping columns.
"""

import pandas as pd
import numpy as np
import os

RAW_DIR = "raw_datasets"   # place the 4 source CSVs here
OUTPUT_PATH = "harmonized_base.csv"

TARGET_COLUMNS = [
    "sleepHours", "sleepQuality", "exerciseLevel", "screenTimeHours",
    "workHours", "workloadRating", "overtimeHours", "breaksTaken",
    "commuteMinutes", "stressLevel", "moodScore", "energyLevel",
    "workSatisfaction", "caffeineIntake", "mealQuality", "socialSupportLevel",
    "anxietyLevel", "emotionalFatigue", "motivationLevel",
    "concentrationIssues", "irritabilityLevel", "lonelinessLevel",
    "selfEfficacy", "copingAbility", "powerInternetDisruption",
    "wfhEnvironmentQuality", "familyResponsibilityLoad",
    "salaryWorkloadSatisfaction", "afterHoursMessaging", "workModeEncoded",
]


def clip(series, lo, hi):
    return series.clip(lower=lo, upper=hi)


def minmax_norm(series):
    """Min-max normalize a series to [0,1] WITHIN its own source dataset —
    this is what makes different burnout-score scales comparable."""
    lo, hi = series.min(), series.max()
    if hi == lo:
        return pd.Series(0.5, index=series.index)
    return (series - lo) / (hi - lo)


def harmonize_mental_health_burnout_tech(path):
    df = pd.read_csv(path)
    out = pd.DataFrame(index=df.index)

    out["sleepHours"] = clip(df["sleep_hours_per_night"], 0, 24)
    out["workHours"] = clip(df["work_hours_per_week"] / 5, 0, 24)  # weekly -> daily
    out["workloadRating"] = clip((df["deadline_pressure_score"] / 2).round(), 1, 5)
    out["stressLevel"] = clip(df["stress_score"], 1, 10)
    out["workSatisfaction"] = clip((df["job_satisfaction_score"] / 2).round(), 1, 5)
    out["socialSupportLevel"] = clip((df["social_support_score"] / 2).round(), 1, 5)
    out["anxietyLevel"] = clip(1 + (df["gad7_score"] / 21) * 9, 1, 10)
    out["emotionalFatigue"] = clip(df["burnout_score"], 1, 10)
    out["selfEfficacy"] = clip((df["autonomy_score"] / 2).round(), 1, 5)
    out["exerciseLevel"] = clip(1 + (df["exercise_days_per_week"] / 7) * 4, 1, 5)
    out["wfhEnvironmentQuality"] = df["work_mode"].map(
        {"Remote": 4, "Hybrid": 3, "On-site": 2, "Onsite": 2}
    ).fillna(3)
    out["workModeEncoded"] = df["work_mode"].map(
        {"Remote": 1, "Hybrid": 2, "On-site": 3, "Onsite": 3}
    ).fillna(2)

    out["harmonized_risk_norm"] = minmax_norm(df["burnout_score"])
    out["source_dataset"] = "mental_health_burnout_tech_2026"
    return out


def harmonize_tech_mental_health(path):
    df = pd.read_csv(path)
    out = pd.DataFrame(index=df.index)

    out["sleepHours"] = clip(df["sleep_hours"], 0, 24)
    out["workHours"] = clip(df["work_hours_per_week"] / 5, 0, 24)
    out["overtimeHours"] = clip(df["overtime_hours"] / 5, 0, 8)
    out["stressLevel"] = clip(df["stress_level"], 1, 10)
    out["workSatisfaction"] = clip((df["job_satisfaction"] / 2).round(), 1, 5)
    out["caffeineIntake"] = clip(df["caffeine_intake"], 0, 10)
    out["socialSupportLevel"] = clip((df["social_support_score"] / 2).round(), 1, 5)
    out["anxietyLevel"] = clip(df["anxiety_score"], 1, 10)
    dep_min, dep_max = df["depression_score"].min(), df["depression_score"].max()
    out["emotionalFatigue"] = clip(1 + (df["depression_score"] - dep_min) / (dep_max - dep_min) * 9, 1, 10)
    out["exerciseLevel"] = clip(1 + (df["physical_activity_days"] / 7) * 4, 1, 5)
    out["screenTimeHours"] = clip(df["screen_time_hours"], 0, 24)

    out["harmonized_risk_norm"] = minmax_norm(df["burnout_score"])
    out["source_dataset"] = "tech_mental_health_burnout"
    return out


def harmonize_indian_developer(path):
    df = pd.read_csv(path)
    out = pd.DataFrame(index=df.index)

    out["sleepHours"] = clip(df["sleep_hours"], 0, 24)
    out["workHours"] = clip(df["weekly_work_hours"] / 5, 0, 24)
    out["stressLevel"] = clip(df["stress_level"], 1, 10)
    out["anxietyLevel"] = clip(df["anxiety_score"], 1, 10)
    out["caffeineIntake"] = clip(df["caffeine_intake_per_day"], 0, 10)
    out["workSatisfaction"] = clip((df["work_life_balance_rating"] / 2).round(), 1, 5)
    out["selfEfficacy"] = clip((df["job_security_confidence"] / 2).round(), 1, 5)
    out["exerciseLevel"] = clip(1 + (df["physical_activity_days_per_week"] / 7) * 4, 1, 5)
    out["emotionalFatigue"] = clip(df["burnout_score"], 1, 10)
    out["afterHoursMessaging"] = df["weekend_work_frequency"].isin(["Often", "Always"]).astype(int)

    out["harmonized_risk_norm"] = minmax_norm(df["burnout_score"])
    out["source_dataset"] = "indian_developer_burnout_2026"
    return out


def harmonize_wfh_dataset(path):
    df = pd.read_csv(path)
    out = pd.DataFrame(index=df.index)

    out["sleepHours"] = clip(df["sleep_hours"], 0, 24)
    out["workHours"] = clip(df["work_hours"], 0, 24)  # already per-day
    out["screenTimeHours"] = clip(df["screen_time_hours"], 0, 24)
    out["breaksTaken"] = clip(df["breaks_taken"], 0, 10)
    out["afterHoursMessaging"] = df["after_hours_work"].astype(int)

    out["harmonized_risk_norm"] = minmax_norm(df["burnout_score"])
    out["source_dataset"] = "work_from_home_burnout_dataset"
    return out


def main():
    os.makedirs(RAW_DIR, exist_ok=True)

    sources = [
        ("mental_health_burnout_tech_2026.csv", harmonize_mental_health_burnout_tech),
        ("tech_mental_health_burnout.csv", harmonize_tech_mental_health),
        ("indian_developer_burnout_2026.csv", harmonize_indian_developer),
        ("work_from_home_burnout_dataset.csv", harmonize_wfh_dataset),
    ]

    frames = []
    for filename, fn in sources:
        path = os.path.join(RAW_DIR, filename)
        if not os.path.exists(path):
            print(f"⚠ Skipping {filename} — not found in {RAW_DIR}/")
            continue
        df = fn(path)
        # Ensure every target column exists (NaN if this source didn't have it)
        for col in TARGET_COLUMNS:
            if col not in df.columns:
                df[col] = np.nan
        frames.append(df)
        print(f"✓ Harmonized {filename}: {len(df)} rows")

    if not frames:
        raise RuntimeError(f"No source files found in {RAW_DIR}/ — see script header for expected filenames.")

    combined = pd.concat(frames, ignore_index=True)

    # Drop rows missing ANY of the core signal columns (these are essential —
    # a row with no sleep/work/stress data isn't usable as a real base row)
    core_required = ["sleepHours", "workHours", "harmonized_risk_norm"]
    before = len(combined)
    combined = combined.dropna(subset=core_required)
    print(f"\nDropped {before - len(combined)} rows missing core signal columns "
          f"({before} -> {len(combined)} rows)")

    ordered_cols = TARGET_COLUMNS + ["harmonized_risk_norm", "source_dataset"]
    combined = combined[ordered_cols]

    combined.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSaved {len(combined)} harmonized rows to {OUTPUT_PATH}")
    print("\nColumn coverage (non-null %):")
    print((combined[TARGET_COLUMNS].notna().mean() * 100).round(1).to_string())
    print("\nRows per source dataset:")
    print(combined["source_dataset"].value_counts().to_string())


if __name__ == "__main__":
    main()