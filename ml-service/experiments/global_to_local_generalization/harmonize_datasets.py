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
    # Work Pattern Monitoring — previously omitted here, which silently
    # dropped these columns (even when a source harmonizer populated them,
    # e.g. Sri Lankan sprintPressureRating/urgentTasksCount/
    # contextSwitchingFrequency) before combined[ordered_cols] selection.
    "meetingsCount", "urgentTasksCount", "sprintPressureRating",
    "deadlineFrequency", "isWeekendWork", "bugFixingLoad",
    "contextSwitchingFrequency", "isOnCallToday",
    "managerSupportLevel", "peerSupportLevel", "autonomyLevel",
    "roleAmbiguity", "taskComplexity", "interruptionsPerDay",
]

SRI_LANKAN_SOURCE = "sri_lankan_developer_burnout"
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


def pick_column(df, *candidates):
    """Return the first matching column name from a list of candidates."""
    normalized = {str(column).strip(): column for column in df.columns}
    for candidate in candidates:
        key = str(candidate).strip()
        if key in normalized:
            return normalized[key]
    raise KeyError(f"None of the candidate columns were found: {candidates}")


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

    work_hours_col = pick_column(df, "Average working hours per day")
    overtime_col = pick_column(
        df,
        "Average overtime hours per week",
        "Average overtime hours per week  \nHours worked beyond your standard contracted hours\nNumber",
    )
    sleep_hours_col = pick_column(df, "Average sleep hours per night")
    power_col = pick_column(
        df,
        "How often do you experience unstable power or internet during work hours?",
    )
    sprint_col = pick_column(df, "Sprint/deadline pressure")
    context_col = pick_column(
        df,
        "Frequency of context switching between tasks",
        "Frequency of context switching between tasks  \nHow often you have to stop one task to handle another  ",
    )
    urgent_col = pick_column(
        df,
        "Number of urgent/unplanned tasks per week",
        "Number of urgent/unplanned tasks per week\nTasks that weren't part of your planned work but had to be done immediately\nNumber    ",
    )
    exhaustion_cols = [pick_column(df, item) for item in SRI_LANKAN_EXHAUSTION_ITEMS]

    # Additional directly-observed Likert/categorical columns wired up
    # alongside the original 7-feature mapping. All Likert items in this
    # survey are on a 1-5 scale (verified against raw CSV values); items
    # whose FEATURE_COLUMNS counterpart expects a wider 1-10 range
    # (stressLevel, anxietyLevel, emotionalFatigue) are linearly rescaled
    # 1-5 -> 1-10. afterHoursMessaging is asked as a 1-5 frequency here but
    # the trained feature expects a 0-1 range, so it is rescaled to [0,1].
    # roleAmbiguity is reverse-scored because the survey asks about role
    # *clarity* (higher = less ambiguous) while the feature is ambiguity
    # (higher = more ambiguous).
    sleep_quality_col = pick_column(df, "How would you rate your sleep quality?")
    exercise_days_col = pick_column(df, "How many days per week do you exercise?")
    screen_time_col = pick_column(df, "Average daily screen time outside work (hours)")
    workload_col = pick_column(df, "How would you rate your current workload?")
    breaks_col = pick_column(df, "Average breaks taken per workday")
    commute_col = pick_column(df, "Average one-way commute time (minutes)")
    stress_col = pick_column(df, "How would you rate your current stress level?")
    energy_col = pick_column(df, "How would you rate your energy level most days?")
    job_satisfaction_col = pick_column(df, "How satisfied are you with your job overall?")
    caffeine_col = pick_column(df, "Average caffeinated drinks per day")
    meal_col = pick_column(df, "How would you rate the quality/regularity of your meals?")
    social_support_col = pick_column(df, "How supported do you feel by people around you generally?")
    anxiety_col = pick_column(df, "How often do you feel anxious about work?")
    emotional_fatigue_col = pick_column(df, "How emotionally drained do you feel by work?")
    motivation_col = pick_column(df, "How motivated do you feel at work?")
    concentration_col = pick_column(df, "How often do you struggle to concentrate?")
    irritability_col = pick_column(df, "How often do you feel irritable?")
    self_efficacy_col = pick_column(df, "How confident are you in handling your work challenges?")
    coping_col = pick_column(df, "How well do you feel you cope with work pressure?")
    salary_workload_col = pick_column(df, "How fair does your pay feel relative to your workload?")
    after_hours_col = pick_column(
        df, "How often are you contacted about work after hours (messages, calls)?"
    )
    weekend_work_col = pick_column(df, "Do you regularly work on weekends?")
    on_call_col = pick_column(df, "Are you currently on an on-call rotation?")
    work_arrangement_col = pick_column(df, "Work arrangement")
    manager_support_col = pick_column(df, "How supported do you feel by your manager?")
    peer_support_col = pick_column(df, "How supported do you feel by your peers/teammates?")
    autonomy_col = pick_column(
        df,
        "How much control do you have over how you do your work?",
        "How much control do you have over how you do your work?  \ne.g. choosing your tools, methods, or schedule ",
    )
    role_clarity_col = pick_column(df, "How clear is what's expected of you in your role?")
    task_complexity_col = pick_column(df, "How complex is your typical day-to-day work?")

    out = pd.DataFrame(index=df.index)
    if "I agree to anonymized data being used for research purposes." in df.columns:
        consent = pd.to_numeric(
            df["I agree to anonymized data being used for research purposes."],
            errors="coerce",
        )
        consent_rate = float(consent.notna().mean()) if len(consent) else 0.0
        print(f"Sri Lankan consent field present; numeric parse success rate: {consent_rate:.2%}")

    def rescale_1_5_to_1_10(series):
        return 1 + (pd.to_numeric(series, errors="coerce") - 1) / 4 * 9

    out["workHours"] = pd.to_numeric(df[work_hours_col], errors="coerce").clip(0, 24)
    out["overtimeHours"] = (pd.to_numeric(df[overtime_col], errors="coerce") / 5).clip(0, 8)
    out["sleepHours"] = pd.to_numeric(df[sleep_hours_col], errors="coerce").clip(0, 24)
    out["powerInternetDisruption"] = pd.to_numeric(
        df[power_col],
        errors="coerce",
    ).clip(1, 5)
    out["sprintPressureRating"] = pd.to_numeric(df[sprint_col], errors="coerce").clip(1, 5)
    out["contextSwitchingFrequency"] = pd.to_numeric(
        df[context_col], errors="coerce"
    ).clip(1, 5)
    out["urgentTasksCount"] = pd.to_numeric(
        df[urgent_col], errors="coerce"
    ).clip(0, 10)

    # --- Newly wired columns (previously left NaN / median-imputed) ---
    out["sleepQuality"] = pd.to_numeric(df[sleep_quality_col], errors="coerce").clip(1, 5)
    out["exerciseLevel"] = (
        1 + (pd.to_numeric(df[exercise_days_col], errors="coerce") / 7) * 4
    ).clip(1, 5)
    out["screenTimeHours"] = pd.to_numeric(df[screen_time_col], errors="coerce").clip(0, 14)
    out["workloadRating"] = pd.to_numeric(df[workload_col], errors="coerce").clip(1, 5)
    out["breaksTaken"] = pd.to_numeric(df[breaks_col], errors="coerce").clip(0, 10)
    out["commuteMinutes"] = pd.to_numeric(df[commute_col], errors="coerce").clip(0, 180)
    out["stressLevel"] = rescale_1_5_to_1_10(df[stress_col]).clip(1, 10)
    out["energyLevel"] = pd.to_numeric(df[energy_col], errors="coerce").clip(1, 5)
    out["workSatisfaction"] = pd.to_numeric(df[job_satisfaction_col], errors="coerce").clip(1, 5)
    out["caffeineIntake"] = pd.to_numeric(df[caffeine_col], errors="coerce").clip(0, 8)
    out["mealQuality"] = pd.to_numeric(df[meal_col], errors="coerce").clip(1, 5)
    out["socialSupportLevel"] = pd.to_numeric(df[social_support_col], errors="coerce").clip(1, 5)
    out["anxietyLevel"] = rescale_1_5_to_1_10(df[anxiety_col]).clip(1, 10)
    out["emotionalFatigue"] = rescale_1_5_to_1_10(df[emotional_fatigue_col]).clip(1, 10)
    out["motivationLevel"] = pd.to_numeric(df[motivation_col], errors="coerce").clip(1, 5)
    out["concentrationIssues"] = pd.to_numeric(df[concentration_col], errors="coerce").clip(1, 5)
    out["irritabilityLevel"] = pd.to_numeric(df[irritability_col], errors="coerce").clip(1, 5)
    out["selfEfficacy"] = pd.to_numeric(df[self_efficacy_col], errors="coerce").clip(1, 5)
    out["copingAbility"] = pd.to_numeric(df[coping_col], errors="coerce").clip(1, 5)
    out["salaryWorkloadSatisfaction"] = pd.to_numeric(
        df[salary_workload_col], errors="coerce"
    ).clip(1, 5)
    out["afterHoursMessaging"] = (
        (pd.to_numeric(df[after_hours_col], errors="coerce") - 1) / 4
    ).clip(0, 1)
    out["isWeekendWork"] = df[weekend_work_col].astype(str).str.strip().str.lower().eq("yes").astype(float)
    out["isOnCallToday"] = df[on_call_col].astype(str).str.strip().str.lower().eq("yes").astype(float)
    out["workModeEncoded"] = df[work_arrangement_col].astype(str).str.strip().map(
        {"Remote": 1, "Hybrid": 2, "On-site": 3, "Onsite": 3}
    )
    out["managerSupportLevel"] = pd.to_numeric(df[manager_support_col], errors="coerce").clip(1, 5)
    out["peerSupportLevel"] = pd.to_numeric(df[peer_support_col], errors="coerce").clip(1, 5)
    out["autonomyLevel"] = pd.to_numeric(df[autonomy_col], errors="coerce").clip(1, 5)
    out["roleAmbiguity"] = (6 - pd.to_numeric(df[role_clarity_col], errors="coerce")).clip(1, 5)
    out["taskComplexity"] = pd.to_numeric(df[task_complexity_col], errors="coerce").clip(1, 5)

    exhaustion = df[exhaustion_cols].apply(pd.to_numeric, errors="coerce")
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
