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
combined only where genuinely comparable. Columns that do not exist in a
given source dataset are left NaN here for downstream inspection and are
not filled using cross-dataset synthetic target generation for model
training.

For the burnout target specifically, the original burnout score is
min-max normalized within each source dataset to [0,1]. The resulting
harmonized scores are then pooled across sources and can be converted
later into global quartile-based risk categories. This should be described
as a rank-based harmonized target, not as a clinically calibrated burnout
probability.

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

SRI_LANKAN_SOURCE = "sri_lankan_developer_burnout"
SRI_LANKAN_EXPECTED_ROWS = 314
SRI_LANKAN_EXHAUSTION_ITEMS = [
    "How often do you feel tired?",
    "How often are you physically exhausted?",
    "How often are you emotionally exhausted?",
    'How often do you think "I can\'t take it anymore"?',
    "How often do you feel worn out?",
    "How often do you feel weak and susceptible to illness?",
]


def clip(series, lo, hi):
    return series.clip(lower=lo, upper=hi)


def minmax_norm(series):
    """Min-max normalize a series to [0,1] WITHIN its own source dataset.

    This preserves within-source rank information while making different
    burnout-score scales comparable before pooled, global risk binning.
    """
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


def harmonize_sri_lankan_survey(path):
    """Map observed Sri Lankan survey fields without inventing unavailable data.

    The survey has no single burnout_score field. Its six observed exhaustion
    items are preserved in ``burnout_measurement`` and averaged into the
    documented ``exhaustion_composite`` outcome. Missing canonical predictors
    remain NaN for downstream, development-only imputation.
    """
    df = pd.read_csv(path)
    df.columns = [str(column).strip() for column in df.columns]
    if len(df) != SRI_LANKAN_EXPECTED_ROWS:
        raise ValueError(
            f"Expected {SRI_LANKAN_EXPECTED_ROWS} Sri Lankan survey rows, found {len(df)}"
        )

    required = [
        "Average working hours per day",
        "Average overtime hours per week",
        "Average sleep hours per night",
        "How often do you experience unstable power or internet during work hours?",
        "Sprint/deadline pressure",
        "Frequency of context switching between tasks",
        "Number of urgent/unplanned tasks per week",
        *SRI_LANKAN_EXHAUSTION_ITEMS,
    ]
    missing_required = [column for column in required if column not in df.columns]
    if missing_required:
        raise ValueError(f"Sri Lankan survey is missing required observed columns: {missing_required}")

    out = pd.DataFrame(index=df.index)
    out["workHours"] = pd.to_numeric(df["Average working hours per day"], errors="coerce").clip(0, 24)
    out["overtimeHours"] = (pd.to_numeric(df["Average overtime hours per week"], errors="coerce") / 5).clip(0, 8)
    out["sleepHours"] = pd.to_numeric(df["Average sleep hours per night"], errors="coerce").clip(0, 24)
    out["powerInternetDisruption"] = pd.to_numeric(
        df["How often do you experience unstable power or internet during work hours?"],
        errors="coerce",
    ).clip(1, 5)
    out["sprintPressureRating"] = pd.to_numeric(df["Sprint/deadline pressure"], errors="coerce").clip(1, 5)
    out["contextSwitchingFrequency"] = pd.to_numeric(
        df["Frequency of context switching between tasks"], errors="coerce"
    ).clip(1, 5)
    out["urgentTasksCount"] = pd.to_numeric(
        df["Number of urgent/unplanned tasks per week"], errors="coerce"
    ).clip(0, 10)

    exhaustion = df[SRI_LANKAN_EXHAUSTION_ITEMS].apply(pd.to_numeric, errors="coerce")
    if exhaustion.isna().any().any():
        raise ValueError("Sri Lankan exhaustion measurement contains missing or non-numeric responses")
    out["burnout_measurement"] = exhaustion.mean(axis=1)
    out["exhaustion_composite"] = out["burnout_measurement"]
    out["harmonized_risk_norm"] = minmax_norm(out["burnout_measurement"])
    out["target_measurement_source"] = "six-item observed exhaustion composite"
    out["source_dataset"] = SRI_LANKAN_SOURCE

    missingness = out.reindex(columns=TARGET_COLUMNS).isna().sum().sort_index()
    print(f"Harmonized {SRI_LANKAN_SOURCE}: {len(out)} rows")
    print("Sri Lankan canonical-feature missingness:")
    print(missingness.to_string())
    unavailable = sorted(set(TARGET_COLUMNS) - set(out.columns))
    print(f"Sri Lankan unavailable canonical features (left NaN): {unavailable}")
    return out


def main():
    os.makedirs(RAW_DIR, exist_ok=True)

    sources = [
        ("mental_health_burnout_tech_2026.csv", harmonize_mental_health_burnout_tech),
        ("tech_mental_health_burnout.csv", harmonize_tech_mental_health),
        ("indian_developer_burnout_2026.csv", harmonize_indian_developer),
        ("work_from_home_burnout_dataset.csv", harmonize_wfh_dataset),
        ("sri_lankan_developer_burnout.csv", harmonize_sri_lankan_survey),
    ]

    frames = []
    for filename, fn in sources:
        path = os.path.join(RAW_DIR, filename)
        if not os.path.exists(path):
            print(f"⚠ Skipping {filename} — not found in {RAW_DIR}/")
            continue
        df = fn(path)
    # Ensure every target column exists (NaN if this source didn't have it).
    # Missingness is handled later within a single dataset, not by mixing
    # in synthetic values from other datasets.
        for col in TARGET_COLUMNS:
            if col not in df.columns:
                df[col] = np.nan
        frames.append(df)
        print(f"Harmonized {filename}: {len(df)} rows")

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

    for col in ["burnout_measurement", "exhaustion_composite", "target_measurement_source"]:
        if col not in combined.columns:
            combined[col] = np.nan
    ordered_cols = TARGET_COLUMNS + [
        "harmonized_risk_norm",
        "burnout_measurement",
        "exhaustion_composite",
        "target_measurement_source",
        "source_dataset",
    ]
    combined = combined[ordered_cols]

    combined.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSaved {len(combined)} harmonized rows to {OUTPUT_PATH}")
    print("\nColumn coverage (non-null %):")
    print((combined[TARGET_COLUMNS].notna().mean() * 100).round(1).to_string())
    print("\nRows per source dataset:")
    print(combined["source_dataset"].value_counts().to_string())


if __name__ == "__main__":
    main()
