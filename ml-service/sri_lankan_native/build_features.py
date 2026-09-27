"""
Sri Lankan-only feature matrix construction.

Builds the predictor feature matrix from sri_lankan_dataset.csv (produced by
build_target.py) using only real, directly-observed survey columns. No
synthetic filling, no training-set medians, no imputation — Step 1's audit
found zero missingness across all 47 raw columns, so none is expected here;
this script verifies that assumption rather than assuming it.

Excludes the 6 exhaustion items and exhaustion_composite (target-construction
inputs, tracked via build_target.get_target_leakage_columns()) from the
feature matrix.

Does not read or write anything under
../experiments/global_to_local_generalization/.
"""

import pandas as pd

from build_target import get_target_leakage_columns

INPUT_PATH = "sri_lankan_dataset.csv"
OUTPUT_PATH = "sri_lankan_model_ready.csv"

ROLE_COL = "Current role  \ne.g. Developer, QA Engineer, DevOps, Team Lead, Product Manager"
COMPANY_SIZE_COL = "Company size"
WORK_ARRANGEMENT_COL = "Work arrangement  "
WEEKEND_COL = " Do you regularly work on weekends?  "
ONCALL_COL = "Are you currently on an on-call rotation?  "

# Ordinal seniority tiering, agreed on in Step 1 review.
SENIORITY_TIERS = {
    "Junior Developer": 1,
    "Developer": 2,
    "Software Engineer": 2,
    "Frontend Developer": 2,
    "Backend Developer": 2,
    "Full Stack Developer": 2,
    "QA Tester": 2,
    "Test Engineer": 2,
    "UI/UX Developer": 2,
    "Mobile Developer": 2,
    "Data Engineer": 2,
    "Data Scientist": 2,
    "Cloud Engineer": 2,
    "DevOps Engineer": 2,
    "QA Engineer": 2,
    "Senior Developer": 3,
    "Senior Software Engineer": 3,
    "Site Reliability Engineer": 3,
    "Tech Lead": 3,
    "Team Lead": 4,
    "Engineering Manager": 4,
    "Scrum Master": 4,
    "Product Manager": 4,
    "Project Manager": 4,
    "Business Analyst": 4,
}

# Explicit assumption: company size is treated as an ordinal scale
# (Startup < SME < Enterprise) on the premise that organizational scale
# plausibly correlates monotonically with structure/bureaucracy-related
# burnout drivers. This is a modeling assumption, not a measured fact about
# this survey — revisit if it doesn't hold up in later feature-importance
# analysis.
COMPANY_SIZE_ORDER = {
    "Startup (<50 employees)": 1,
    "SME (50-500)": 2,
    "Enterprise (500+)": 3,
}


def fix_mangled_company_size(series: pd.Series) -> pd.Series:
    # "SME (50–500)" -> "SME (50-500)"; cosmetic en-dash artifact from
    # the source file, category count is unaffected (still 3 distinct values).
    return series.str.replace("–", "-", regex=False)


def encode_seniority_tier(series: pd.Series) -> pd.Series:
    unmapped = set(series.unique()) - set(SENIORITY_TIERS)
    assert not unmapped, f"Unmapped role values: {unmapped}"
    return series.map(SENIORITY_TIERS)


def encode_company_size(series: pd.Series) -> pd.Series:
    series = fix_mangled_company_size(series)
    unmapped = set(series.unique()) - set(COMPANY_SIZE_ORDER)
    assert not unmapped, f"Unmapped company size values: {unmapped}"
    return series.map(COMPANY_SIZE_ORDER)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    leakage_cols = get_target_leakage_columns()
    exclude = set(leakage_cols) | {"exhaustion_composite", "riskLevel"}

    features = df.drop(columns=[c for c in exclude if c in df.columns]).copy()

    features["seniority_tier"] = encode_seniority_tier(features[ROLE_COL])
    features["company_size_tier"] = encode_company_size(features[COMPANY_SIZE_COL])
    features[WEEKEND_COL.strip()] = (features[WEEKEND_COL] == "Yes").astype(int)
    features[ONCALL_COL.strip()] = (features[ONCALL_COL] == "Yes").astype(int)

    work_arrangement_dummies = pd.get_dummies(
        features[WORK_ARRANGEMENT_COL], prefix="work_arrangement", drop_first=True
    ).astype(int)
    features = pd.concat([features, work_arrangement_dummies], axis=1)

    features = features.drop(
        columns=[ROLE_COL, COMPANY_SIZE_COL, WORK_ARRANGEMENT_COL, WEEKEND_COL, ONCALL_COL]
    )

    # tidy whitespace-padded column names from the raw survey export
    features.columns = [c.strip() for c in features.columns]

    return features


def report_missingness(features: pd.DataFrame) -> None:
    missing = features.isna().sum()
    total_missing = missing.sum()
    print(f"Missingness check: {total_missing} missing values introduced by encoding")
    if total_missing:
        print(missing[missing > 0].to_string())
    print()


def report_seniority_experience_correlation(df: pd.DataFrame, features: pd.DataFrame) -> None:
    years_col = "Years of professional software development experience  "
    corr = df[years_col].corr(features["seniority_tier"])
    print(f"Correlation(years_of_experience, seniority_tier) = {corr:.4f}")
    print()


def main():
    df = pd.read_csv(INPUT_PATH)
    assert len(df) == 314, f"Expected 314 rows, got {len(df)}"

    features = build_features(df)
    report_missingness(features)
    report_seniority_experience_correlation(df, features)

    print(f"Final feature count: {features.shape[1]}")
    print("Feature columns:")
    for col in features.columns:
        print(f"  - {col}")
    print()

    model_ready = features.copy()
    model_ready["riskLevel"] = df["riskLevel"]

    model_ready.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved {model_ready.shape[0]} rows x {model_ready.shape[1]} columns to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
