"""
generate_dataset.py (v2 — hybrid real + synthetic)

Takes harmonized_base.csv (real survey rows, partially populated across
BurnoutGuard's 28-feature schema) and:
  1. Keeps every real value exactly as harmonized.
  2. Fills only the genuinely missing columns (features no source dataset
     captured — mostly the psychosocial and Sri Lanka-specific ones) using
     domain-informed synthetic generation, correlated with that row's real
     harmonized_risk_norm so the synthetic values stay consistent with the
     row's real burnout signal rather than being pure noise.
  3. Blends harmonized_risk_norm (real, 70% weight) with a weighted score
     computed across ALL 28 features (synthetic, 30% weight) to produce
     final class labels — grounding labels primarily in real data while
     still reflecting the full feature set.

METHODOLOGY NOTE (for FYP report): No dataset used contains Sri Lankan
respondents or the specific psychosocial/SL-context constructs this study
introduces (anxietyLevel, emotionalFatigue, powerInternetDisruption, etc.).
These fields are therefore necessarily synthetic in this iteration, grounded
via correlation with real burnout signal from the harmonized base population.
This is documented as a limitation; primary data collection from Sri Lankan
developers is recommended as future work to validate/replace these fields.
"""

import numpy as np
import pandas as pd

np.random.seed(42)

HARMONIZED_PATH = "harmonized_base.csv"
OUTPUT_PATH = "dataset.csv"

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
}

# Same direction-of-effect weights as before: positive = increases risk.
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
    "workModeEncoded": 0.2,  # Onsite(3) slightly higher than Remote(1) — commute/rigidity burden
}


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def fill_synthetic_column(col, n, risk_norm):
    """Generates a synthetic column correlated with risk_norm (0=low risk,
    1=high risk), respecting the feature's real-world range and the
    direction it should move with risk (from WEIGHTS' sign)."""
    lo, hi = FEATURE_RANGES[col]
    weight = WEIGHTS.get(col, 0)

    # Base value centered at range midpoint, shifted toward lo/hi by risk_norm
    # depending on whether higher values of this feature increase risk.
    midpoint = (lo + hi) / 2
    span = (hi - lo) / 2

    direction = 1 if weight > 0 else -1
    shift = direction * (risk_norm - 0.5) * span * 1.2  # correlated shift
    noise = np.random.normal(0, span * 0.25, n)          # individual variance

    values = midpoint + shift + noise
    return np.clip(values, lo, hi)


def main():
    base = pd.read_csv(HARMONIZED_PATH)
    n = len(base)
    print(f"Loaded {n} harmonized base rows.")

    risk_norm = base["harmonized_risk_norm"].values

    df = pd.DataFrame(index=base.index)

    for col in FEATURE_RANGES:
        if col in base.columns and base[col].notna().any():
            real_values = base[col].to_numpy(dtype=np.float64, copy=True)  # writable copy
            missing_mask = np.isnan(real_values)
            if missing_mask.any():
                synthetic_fill = fill_synthetic_column(col, n, risk_norm)
                real_values[missing_mask] = synthetic_fill[missing_mask]
            df[col] = real_values
            coverage = 100 * (1 - missing_mask.mean())
        else:
            df[col] = fill_synthetic_column(col, n, risk_norm)
            coverage = 0.0
        print(f"  {col}: {coverage:.1f}% from real data, rest synthetic")

    # afterHoursMessaging is boolean — handle separately (not in FEATURE_RANGES)
    if "afterHoursMessaging" in base.columns and base["afterHoursMessaging"].notna().any():
        real_bool = base["afterHoursMessaging"].to_numpy(dtype=np.float64, copy=True)
        missing_mask = np.isnan(real_bool)
        synthetic_bool = (np.random.rand(n) < (0.25 + 0.4 * risk_norm)).astype(float)
        real_bool[missing_mask] = synthetic_bool[missing_mask]
        df["afterHoursMessaging"] = real_bool.astype(int)
    else:
        df["afterHoursMessaging"] = (np.random.rand(n) < (0.25 + 0.4 * risk_norm)).astype(int)

    # New boolean work-pattern fields — same correlated-random approach
    df["isWeekendWork"] = (np.random.rand(n) < (0.15 + 0.35 * risk_norm)).astype(int)
    df["isOnCallToday"] = (np.random.rand(n) < (0.10 + 0.30 * risk_norm)).astype(int)

    # ---- Compute final weighted synthetic score across ALL 28 features ----
    synthetic_risk_raw = np.zeros(n)
    for col, weight in WEIGHTS.items():
        lo, hi = FEATURE_RANGES[col]
        normalized = (df[col] - lo) / (hi - lo)
        synthetic_risk_raw += weight * normalized
    synthetic_risk_raw += 0.5 * df["afterHoursMessaging"]
    synthetic_risk_raw += 0.4 * df["isWeekendWork"]
    synthetic_risk_raw += 0.5 * df["isOnCallToday"]
    synthetic_risk_norm = pd.Series(sigmoid(synthetic_risk_raw))
    synthetic_risk_norm = (synthetic_risk_norm - synthetic_risk_norm.min()) / \
                           (synthetic_risk_norm.max() - synthetic_risk_norm.min())

    # ---- Blend: 70% real harmonized signal, 30% full-feature synthetic signal ----
    final_risk = 0.7 * risk_norm + 0.3 * synthetic_risk_norm.values
    final_risk += np.random.normal(0, 0.06, n)  # small realism noise
    final_risk = np.clip(final_risk, 0, 1)

    quantiles = np.quantile(final_risk, [0.25, 0.5, 0.75])
    q1, q2, q3 = quantiles

    def label(x):
        if x < q1: return "Low"
        elif x < q2: return "Moderate"
        elif x < q3: return "High"
        return "Critical"

    df["riskLevel"] = [label(x) for x in final_risk]

    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSaved {len(df)} rows to {OUTPUT_PATH}")
    print(df["riskLevel"].value_counts())


if __name__ == "__main__":
    main()