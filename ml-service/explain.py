"""
explain.py

Generates SHAP-based explanations for a single prediction, formatted to
match backend/src/models/ShapExplanation.ts exactly.
"""

import shap
import numpy as np

from preprocess import FEATURE_COLUMNS, INT_TO_RISK

# Human-readable phrasing per feature, used to build plainLanguageText.
FEATURE_LABELS = {
    "sleepHours": "your sleep duration",
    "sleepQuality": "your sleep quality",
    "exerciseLevel": "your exercise level",
    "screenTimeHours": "your screen time",
    "workHours": "your working hours",
    "workloadRating": "your workload",
    "overtimeHours": "your overtime hours",
    "breaksTaken": "the breaks you take",
    "commuteMinutes": "your commute time",
    "stressLevel": "your stress level",
    "moodScore": "your mood",
    "energyLevel": "your energy level",
    "workSatisfaction": "your work satisfaction",
    "caffeineIntake": "your caffeine intake",
    "mealQuality": "your meal quality",
    "socialSupportLevel": "your social support",
    "anxietyLevel": "your anxiety level",
    "emotionalFatigue": "your emotional fatigue",
    "motivationLevel": "your motivation",
    "concentrationIssues": "concentration difficulties",
    "irritabilityLevel": "your irritability",
    "lonelinessLevel": "your sense of loneliness",
    "selfEfficacy": "your self-confidence",
    "copingAbility": "your coping ability",
    "powerInternetDisruption": "power/internet disruptions",
    "wfhEnvironmentQuality": "your WFH environment",
    "familyResponsibilityLoad": "family responsibilities",
    "salaryWorkloadSatisfaction": "salary-workload balance",
    "afterHoursMessaging": "after-hours work messaging",
}


def explain_prediction(model, scaler, feature_df, predicted_class: int) -> list:
    """
    feature_df: single-row pandas DataFrame in FEATURE_COLUMNS order.
    predicted_class: the int label the model predicted (0=Low..3=Critical).
    Returns a list of dicts matching ShapExplanation.ts's shape.
    """
    scaled = scaler.transform(feature_df)

    explainer = shap.TreeExplainer(model) if hasattr(model, "get_booster") or hasattr(model, "estimators_") \
        else shap.Explainer(model, scaled)

    shap_values = explainer.shap_values(scaled)

    # For multi-class tree models, shap_values is a list per class OR a 3D array
    if isinstance(shap_values, list):
        class_shap = shap_values[predicted_class][0]
    elif shap_values.ndim == 3:
        class_shap = shap_values[0, :, predicted_class]
    else:
        class_shap = shap_values[0]

    rows = []
    for idx, feature_name in enumerate(FEATURE_COLUMNS):
        value = float(feature_df.iloc[0][feature_name])
        shap_val = float(class_shap[idx])
        direction = "IncreasesRisk" if shap_val > 0 else "DecreasesRisk"
        rows.append({
            "featureName": feature_name,
            "shapValue": round(shap_val, 4),
            "featureValue": value,
            "direction": direction,
            "_absShap": abs(shap_val),
        })

    rows.sort(key=lambda r: r["_absShap"], reverse=True)
    for rank, row in enumerate(rows, start=1):
        row["importanceRank"] = rank
        label = FEATURE_LABELS.get(row["featureName"], row["featureName"])
        if row["direction"] == "IncreasesRisk":
            row["plainLanguageText"] = f"{label.capitalize()} is increasing your burnout risk."
        else:
            row["plainLanguageText"] = f"{label.capitalize()} is helping reduce your burnout risk."
        del row["_absShap"]

    return rows