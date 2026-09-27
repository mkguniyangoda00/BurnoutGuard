"""
Renames the 40 feature columns (+ riskLevel) in sri_lankan_model_ready.csv
from raw survey question text (often multi-line) into short, single-line
snake_case names for use in code/plots. Saves the old -> new mapping as JSON
so the original survey wording is preserved for reference.

Reads and re-saves only sri_lankan_model_ready.csv within sri_lankan_native/.
Does not touch sri_lankan_dataset.csv or anything under
../experiments/global_to_local_generalization/.
"""

import json

import pandas as pd

INPUT_PATH = "sri_lankan_model_ready.csv"
MAPPING_PATH = "column_name_mapping.json"

COLUMN_RENAME_MAP = {
    "Years of professional software development experience": "years_of_experience",
    "Average working hours per day": "working_hours_per_day",
    "Average overtime hours per week  \nHours worked beyond your standard contracted hours\nNumber": "overtime_hours_per_week",
    "How would you rate your current workload?": "workload_rating",
    "Number of urgent/unplanned tasks per week\nTasks that weren't part of your planned work but had to be done immediately\nNumber": "urgent_tasks_per_week",
    "Sprint/deadline pressure": "deadline_pressure",
    "Frequency of context switching between tasks  \nHow often you have to stop one task to handle another": "context_switching_frequency",
    "How often are you contacted about work after hours (messages, calls)?": "after_hours_contact_frequency",
    "How complex is your typical day-to-day work?": "work_complexity",
    "Average sleep hours per night": "sleep_hours_per_night",
    "How would you rate your sleep quality?": "sleep_quality",
    "How many days per week do you exercise?": "exercise_days_per_week",
    "Average daily screen time outside work (hours)": "screen_time_outside_work_hours",
    "Average breaks taken per workday": "breaks_per_workday",
    "Average one-way commute time (minutes)": "commute_time_minutes",
    "Average caffeinated drinks per day": "caffeinated_drinks_per_day",
    "How would you rate the quality/regularity of your meals?": "meal_quality_rating",
    "How often do you experience unstable power or internet during work hours?": "unstable_power_internet_frequency",
    "How would you rate your current stress level?": "stress_level",
    "How would you rate your energy level most days?": "energy_level",
    "How often do you feel anxious about work?": "work_anxiety_frequency",
    "How emotionally drained do you feel by work?": "emotional_drain_level",
    "How motivated do you feel at work?": "motivation_level",
    "How often do you struggle to concentrate?": "concentration_difficulty",
    "How often do you feel irritable?": "irritability_frequency",
    "How satisfied are you with your job overall?": "job_satisfaction",
    "How confident are you in handling your work challenges?": "work_challenge_confidence",
    "How well do you feel you cope with work pressure?": "pressure_coping_rating",
    "How supported do you feel by people around you generally?": "general_support_rating",
    "How supported do you feel by your manager?": "manager_support_rating",
    "How supported do you feel by your peers/teammates?": "peer_support_rating",
    "How fair does your pay feel relative to your workload?": "pay_fairness_rating",
    "How much control do you have over how you do your work?  \ne.g. choosing your tools, methods, or schedule": "work_autonomy_rating",
    "How clear is what's expected of you in your role?": "role_clarity_rating",
    "seniority_tier": "seniority_tier",
    "company_size_tier": "company_size_tier",
    "Do you regularly work on weekends?": "works_weekends",
    "Are you currently on an on-call rotation?": "on_call_rotation",
    "work_arrangement_On-site": "work_arrangement_onsite",
    "work_arrangement_Remote": "work_arrangement_remote",
    "riskLevel": "risk_level",
}


def main():
    df = pd.read_csv(INPUT_PATH)

    missing = set(df.columns) - set(COLUMN_RENAME_MAP)
    unused = set(COLUMN_RENAME_MAP) - set(df.columns)
    assert not missing, f"Columns in CSV with no rename mapping: {missing}"
    assert not unused, f"Rename mapping entries not present in CSV: {unused}"

    new_names = [COLUMN_RENAME_MAP[c] for c in df.columns]
    assert len(new_names) == len(set(new_names)), "Rename produced duplicate column names"

    old_to_new = {old: COLUMN_RENAME_MAP[old] for old in df.columns}
    with open(MAPPING_PATH, "w", encoding="utf-8") as f:
        json.dump(old_to_new, f, indent=2, ensure_ascii=False)

    df = df.rename(columns=COLUMN_RENAME_MAP)
    df.to_csv(INPUT_PATH, index=False)

    print(f"Renamed {len(old_to_new)} columns. Mapping saved to {MAPPING_PATH}.")
    print(f"Re-saved {df.shape[0]} rows x {df.shape[1]} columns to {INPUT_PATH}.")
    print()
    print("New column names:")
    for c in df.columns:
        print(f"  - {c}")


if __name__ == "__main__":
    main()
