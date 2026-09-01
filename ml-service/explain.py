"""
explain.py

Generates SHAP-based explanations for a single prediction, formatted to
match backend/src/models/ShapExplanation.ts exactly.
"""

import shap
import numpy as np

from preprocess import FEATURE_COLUMNS, INT_TO_RISK


def _shap_array(shap_values, predicted_class=None):
    values = shap_values
    if isinstance(values, list):
        if predicted_class is None:
            return np.stack([np.asarray(item) for item in values], axis=-1)
        return np.asarray(values[predicted_class])
    values = np.asarray(values)
    if values.ndim == 3 and predicted_class is not None:
        return values[:, :, predicted_class]
    return values


def _pipeline_feature_names(preprocessing):
    names = preprocessing.get_feature_names_out()
    return [name.split("__", 1)[-1] for name in names]


def compute_pipeline_shap_results(pipeline, X, local_rows=3, background_rows=100):
    """Compute leakage-safe SHAP results for a fitted final pipeline.

    X must contain only legitimate predictor columns. The returned values are
    associated with model predictions and are not causal effects.
    """
    if not set(X.columns).issubset(set(FEATURE_COLUMNS)):
        raise ValueError("SHAP input contains non-predictor or target-derived columns")
    preprocessing = pipeline.named_steps["preprocessing"]
    estimator = pipeline.named_steps["model"]
    transformed = preprocessing.transform(X[FEATURE_COLUMNS])
    names = _pipeline_feature_names(preprocessing)
    background = transformed[:background_rows]
    if len(background) == 0:
        raise ValueError("SHAP requires at least one background predictor row")

    is_tree_model = hasattr(estimator, "get_booster") or hasattr(estimator, "estimators_") or hasattr(estimator, "booster_")
    if is_tree_model:
        explainer = shap.TreeExplainer(estimator)
    else:
        explainer = shap.Explainer(estimator, background)
    shap_values = explainer.shap_values(transformed[:max(local_rows, 200)])
    values = _shap_array(shap_values)
    if values.ndim == 3:
        global_scores = np.abs(values).mean(axis=(0, 2))
    elif isinstance(shap_values, list):
        global_scores = np.stack([np.abs(np.asarray(item)) for item in shap_values]).mean(axis=(0, 1))
    else:
        global_scores = np.abs(values).mean(axis=0)
    ranking = [
        {"featureName": name, "meanAbsShap": round(float(score), 6)}
        for name, score in zip(names, global_scores)
    ]
    ranking.sort(key=lambda row: row["meanAbsShap"], reverse=True)

    local_explanations = []
    local_values = _shap_array(shap_values, predicted_class=None)
    predictions = pipeline.predict(X.iloc[:local_rows][FEATURE_COLUMNS])
    for row_index, prediction in enumerate(predictions):
        row_values = local_values[row_index]
        if row_values.ndim == 2:
            row_values = row_values[:, int(prediction)]
        entries = [
            {
                "featureName": name,
                "shapValue": round(float(value), 6),
                "association": "associated with a higher model prediction" if value > 0 else "associated with a lower model prediction",
            }
            for name, value in zip(names, row_values)
        ]
        entries.sort(key=lambda item: abs(item["shapValue"]), reverse=True)
        local_explanations.append({"rowIndex": int(X.index[row_index]), "predictedClass": int(prediction), "features": entries})

    return {
        "featureNames": names,
        "globalImportance": ranking,
        "featureRanking": [row["featureName"] for row in ranking],
        "localExplanations": local_explanations,
        "interpretation": "SHAP values describe features associated with model predictions; they do not establish causation.",
    }

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
    "meetingsCount": "your number of meetings",
    "urgentTasksCount": "your urgent/unplanned tasks",
    "sprintPressureRating": "your sprint pressure",
    "deadlineFrequency": "how often you face deadlines",
    "isWeekendWork": "working on weekends",
    "bugFixingLoad": "your bug-fixing load",
    "contextSwitchingFrequency": "how often you switch context",
    "isOnCallToday": "being on-call",
    "workModeEncoded": "your work arrangement (remote/hybrid/onsite)",
    "managerSupportLevel": "manager support",
    "peerSupportLevel": "peer support",
    "autonomyLevel": "autonomy at work",
    "roleAmbiguity": "role clarity",
    "taskComplexity": "task complexity",
    "interruptionsPerDay": "daily interruptions",
}


def explain_prediction(model, scaler, feature_df, predicted_class: int, background=None) -> list:
    """
    feature_df: single-row pandas DataFrame in FEATURE_COLUMNS order.
    predicted_class: the int label the model predicted (0=Low..3=Critical).
    background: a representative sample of SCALED training rows (NOT the
    row being explained) used as SHAP's reference distribution. Returns a
    list of dicts matching ShapExplanation.ts's shape.
    """
    scaled = scaler.transform(feature_df)

    is_tree_model = hasattr(model, "get_booster") or hasattr(model, "estimators_")

    if is_tree_model:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(scaled)
    else:
        if background is None:
            print(
                "[explain.py] WARNING: no background sample available — "
                "SHAP values will be unreliable (near-zero) until the model "
                "is retrained with the updated train.py that saves one."
            )
            background = scaled  # old, buggy behavior — only used as a last resort
        explainer = shap.Explainer(model, background)
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


def compute_global_feature_importance(model, X_sample, background=None):
    """
    Computes mean absolute SHAP value per feature across a representative
    sample. Returns a list of {featureName, meanAbsShap} sorted descending.
    """
    is_tree_model = hasattr(model, "get_booster") or hasattr(model, "estimators_") or hasattr(model, "booster_")

    if is_tree_model:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_sample)
    else:
        if background is None:
            background = X_sample
        explainer = shap.Explainer(model, background)
        shap_values = explainer.shap_values(X_sample)

    if isinstance(shap_values, list):
        # Average absolute SHAP across classes and samples.
        arr = np.stack([np.abs(np.asarray(v)) for v in shap_values], axis=0)
        feature_scores = arr.mean(axis=(0, 1))
    else:
        arr = np.asarray(shap_values)
        if arr.ndim == 3:
          # (samples, features, classes)
            feature_scores = np.abs(arr).mean(axis=(0, 2))
        else:
            feature_scores = np.abs(arr).mean(axis=0)

    rows = []
    for idx, feature_name in enumerate(FEATURE_COLUMNS):
        rows.append({
            "featureName": feature_name,
            "meanAbsShap": round(float(feature_scores[idx]), 6),
        })

    rows.sort(key=lambda row: row["meanAbsShap"], reverse=True)
    return rows


def apply_calibrated_probabilities(model, feature_df, calibrators=None):
    scaled = feature_df
    probs = model.predict_proba(scaled)
    if not calibrators:
        return probs[0]
    calibrated = np.array([calibrators[idx].transform([probs[0][idx]])[0] for idx in range(probs.shape[1])], dtype=float)
    calibrated = np.clip(calibrated, 1e-6, 1.0)
    calibrated = calibrated / calibrated.sum()
    return calibrated
