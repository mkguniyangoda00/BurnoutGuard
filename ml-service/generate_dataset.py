"""
generate_dataset.py

Generates a synthetic burnout dataset for initial model training.

IMPORTANT (FYP note): This is a placeholder dataset built from domain-informed
weightings, NOT real survey data. Replace dataset.csv with real responses from
Sri Lankan software developers as soon as data collection is complete, then
simply rerun train.py — no other code needs to change.
"""

import numpy as np
import pandas as pd

np.random.seed(42)
N_SAMPLES = 3000

FEATURE_RANGES = {
    "sleepHours": (0, 12),
    "sleepQuality": (1, 5),
    "exerciseLevel": (1, 5),
    "screenTimeHours": (0, 14),
    "workHours": (0, 14),
    "workloadRating": (1, 5),
    "overtimeHours": (0, 8),
    "breaksTaken": (0, 10),
    "commuteMinutes": (0, 180),
    "stressLevel": (1, 10),
    "moodScore": (1, 10),
    "energyLevel": (1, 5),
    "workSatisfaction": (1, 5),
    "caffeineIntake": (0, 8),
    "mealQuality": (1, 5),
    "socialSupportLevel": (1, 5),
    "anxietyLevel": (1, 10),
    "emotionalFatigue": (1, 10),
    "motivationLevel": (1, 5),
    "concentrationIssues": (1, 5),
    "irritabilityLevel": (1, 5),
    "lonelinessLevel": (1, 5),
    "selfEfficacy": (1, 5),
    "copingAbility": (1, 5),
    "powerInternetDisruption": (1, 5),
    "wfhEnvironmentQuality": (1, 5),
    "familyResponsibilityLoad": (1, 5),
    "salaryWorkloadSatisfaction": (1, 5),
}

# Weights: positive = increases burnout risk, negative = decreases risk.
# Values are applied to each feature normalized to [0, 1] before weighting.
WEIGHTS = {
    "sleepHours": -1.4,
    "sleepQuality": -1.0,
    "exerciseLevel": -0.5,
    "screenTimeHours": 0.5,
    "workHours": 0.9,
    "workloadRating": 0.8,
    "overtimeHours": 1.1,
    "breaksTaken": -0.4,
    "commuteMinutes": 0.3,
    "stressLevel": 1.3,
    "moodScore": -1.0,
    "energyLevel": -0.5,
    "workSatisfaction": -0.6,
    "caffeineIntake": 0.3,
    "mealQuality": -0.3,
    "socialSupportLevel": -0.6,
    "anxietyLevel": 1.1,
    "emotionalFatigue": 1.2,
    "motivationLevel": -0.5,
    "concentrationIssues": 0.4,
    "irritabilityLevel": 0.4,
    "lonelinessLevel": 0.5,
    "selfEfficacy": -0.5,
    "copingAbility": -0.5,
    "powerInternetDisruption": 0.4,
    "wfhEnvironmentQuality": -0.4,
    "familyResponsibilityLoad": 0.3,
    "salaryWorkloadSatisfaction": -0.4,
}


def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-x))


def generate() -> pd.DataFrame:
    data = {}
    for feature, (lo, hi) in FEATURE_RANGES.items():
        data[feature] = np.random.uniform(lo, hi, N_SAMPLES)

    # Boolean feature: after-hours messaging (~40% true)
    data["afterHoursMessaging"] = (np.random.rand(N_SAMPLES) < 0.4).astype(int)

    df = pd.DataFrame(data)

    # Normalize each feature to [0,1] and compute weighted risk score
    risk_raw = np.zeros(N_SAMPLES)
    for feature, weight in WEIGHTS.items():
        lo, hi = FEATURE_RANGES[feature]
        normalized = (df[feature] - lo) / (hi - lo)
        risk_raw += weight * normalized

    # after-hours messaging weight (already 0/1)
    risk_raw += 0.5 * df["afterHoursMessaging"]

    # Add noise for realism
    risk_raw += np.random.normal(0, 0.8, N_SAMPLES)

    risk_prob = sigmoid(risk_raw)
    df["riskScoreRaw"] = risk_prob

    # Quantile-based labels for balanced classes
    quantiles = risk_prob.quantile([0.25, 0.5, 0.75]) if hasattr(risk_prob, "quantile") else np.quantile(risk_prob, [0.25, 0.5, 0.75])
    q1, q2, q3 = quantiles

    def label(x):
        if x < q1:
            return "Low"
        elif x < q2:
            return "Moderate"
        elif x < q3:
            return "High"
        return "Critical"

    df["riskLevel"] = risk_prob.apply(label) if hasattr(risk_prob, "apply") else [label(x) for x in risk_prob]
    df = df.drop(columns=["riskScoreRaw"])
    return df


if __name__ == "__main__":
    df = generate()
    df.to_csv("dataset.csv", index=False)
    print(f"Generated dataset.csv with {len(df)} rows.")
    print(df["riskLevel"].value_counts())   