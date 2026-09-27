"""
Sri Lankan-only target construction.

Builds exhaustion_composite and riskLevel for the 314-row Sri Lankan developer
survey using ONLY this population's own data — no external datasets, no
borrowed quantile thresholds. This directly fixes the failure mode documented
in ../experiments/global_to_local_generalization/NEGATIVE_RESULT.md and
target_construction_audit.md: the old pipeline anchored exhaustion_composite's
min-max normalization to these same 314 rows, but then cut it with quantile
thresholds fit on four external datasets' burnout_score — a different raw
field, different population. That produced a degenerate 57.3%-Critical
distribution. Here, both the composite AND the quantile thresholds are fit
within this population, so the resulting classes reflect this population's own
distribution of exhaustion.

Does not read or write anything under
../experiments/global_to_local_generalization/.
"""

import pandas as pd

RAW_PATH = "../raw_datasets/sri_lankan_developer_burnout.csv"
OUTPUT_PATH = "sri_lankan_dataset.csv"

EXHAUSTION_ITEMS = [
    "How often do you feel tired?  ",
    "How often are you physically exhausted?  ",
    "How often are you emotionally exhausted?  ",
    "How often do you think \"I can't take it anymore\"?  ",
    "How often do you feel worn out?  ",
    "How often do you feel weak and susceptible to illness?  ",
]

METADATA_COLUMNS = [
    "Timestamp",
    "I agree to anonymized data being used for research purposes.  ",
]

RISK_LEVELS = ["Low", "Moderate", "High", "Critical"]


def get_target_leakage_columns():
    """
    Columns that must never appear in the feature matrix because they were
    used to construct the target (exhaustion_composite / riskLevel).
    Mirrors the intent of the old pipeline's get_target_leakage_columns(),
    but scoped to this self-referenced, population-native target.
    """
    return list(EXHAUSTION_ITEMS)


def build_target(df: pd.DataFrame) -> pd.DataFrame:
    exhaustion = df[EXHAUSTION_ITEMS].apply(pd.to_numeric, errors="raise")
    df = df.copy()
    df["exhaustion_composite"] = exhaustion.mean(axis=1)

    quantiles = df["exhaustion_composite"].quantile([0.25, 0.5, 0.75])
    q25, q50, q75 = quantiles.loc[0.25], quantiles.loc[0.5], quantiles.loc[0.75]

    edges = [-float("inf"), q25, q50, q75, float("inf")]
    df["riskLevel"] = pd.cut(
        df["exhaustion_composite"], bins=edges, labels=RISK_LEVELS, right=True
    )

    print("Self-referenced quantile thresholds (fit on these 314 rows only):")
    print(f"  q25 = {q25}")
    print(f"  q50 = {q50}")
    print(f"  q75 = {q75}")
    print()

    return df, {"q25": q25, "q50": q50, "q75": q75}


def report_class_distribution(df: pd.DataFrame) -> None:
    counts = df["riskLevel"].value_counts().reindex(RISK_LEVELS)
    pct = (counts / len(df) * 100).round(1)
    print("riskLevel class distribution (n=%d):" % len(df))
    for level in RISK_LEVELS:
        print(f"  {level:10s} {counts[level]:4d}  ({pct[level]}%)")
    print()


def leakage_check(df: pd.DataFrame) -> None:
    """
    Explicit assertion: exhaustion_composite and its 6 source items must not
    end up in the eventual feature matrix built in the Step 3 companion
    script. This function only checks that this script's own output makes the
    leakage columns identifiable — it does not build the feature matrix.
    """
    leakage_cols = get_target_leakage_columns()
    for col in leakage_cols:
        assert col in df.columns, f"Expected leakage-tracked column missing: {col}"
    print("Leakage check: the following columns are target-construction inputs")
    print("and MUST be excluded from the feature matrix (see get_target_leakage_columns()):")
    for col in leakage_cols:
        print(f"  - {col.strip()}")
    print("  - exhaustion_composite (derived target, continuous)")
    print()


def main():
    df = pd.read_csv(RAW_PATH)
    assert len(df) == 314, f"Expected 314 rows, got {len(df)}"

    df, thresholds = build_target(df)
    report_class_distribution(df)
    leakage_check(df)

    df = df.drop(columns=METADATA_COLUMNS)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved {len(df)} rows x {len(df.columns)} columns to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
