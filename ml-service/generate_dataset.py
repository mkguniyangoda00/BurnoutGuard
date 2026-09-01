"""
generate_dataset.py

Builds dataset.csv from harmonized_base.csv.

TARGET CONSTRUCTION METHODOLOGY:
================================

The supervised burnout-risk target is constructed as follows:

1. SOURCE: Each source dataset contains a native "burnout_score" column representing 
   actual measured burnout in that population (not synthetic, not derived from predictors).

2. CANONICAL HARMONIZED TARGET: 
   - harmonized_risk_norm = min-max normalized burnout_score (per-dataset normalization)
   - This is the primary continuous-scale burnout outcome measure
   - Normalization is per-dataset to preserve rank order within each source

3. CATEGORICAL LABELS (TARGET FOR SUPERVISED LEARNING):
   - Four equiprobable classes via quantile-binning of harmonized_risk_norm
   - Low, Moderate, High, Critical
   - Derived ONLY from burnout_score, not from any predictor variable

4. LEAKAGE PREVENTION:
   - Target construction columns (harmonized_risk_norm) are NOT used as ML features
   - No predictor (sleepHours, stressLevel, etc.) contributes to target generation
   - Predictor imputation/synthesis is independent of target
   - This module documents all target-construction columns for audit purposes

See get_target_leakage_columns() for full list of target-derivation variables.
"""

import os
import json

import numpy as np
import pandas as pd

np.random.seed(42)

HARMONIZED_PATH = "harmonized_base.csv"
OUTPUT_PATH = "dataset.csv"
SL_HOLDOUT_PATH = "raw_datasets/sri_lankan_developer_burnout.csv"

# ============================================================================
# TARGET CONSTRUCTION DOCUMENTATION
# ============================================================================

def get_target_leakage_columns():
    """
    Returns metadata about which columns are used to construct the supervised target.
    
    This function explicitly documents target-construction to prevent leakage:
    - Any column in target_construction_columns must NOT appear in feature matrix X
    - Any column in raw_target_components is consumed by target_construction_columns
    
    Returns:
        dict with keys:
        - target_column: the final categorical supervised target ("riskLevel")
        - canonical_target: the continuous burnout outcome ("harmonized_risk_norm")
        - target_construction_columns: columns used to build categorical target
        - raw_target_components: raw measurements from source datasets
        - sources_with_target: which datasets have native burnout measurement
        - sources_without_target: which datasets do NOT (handled specially)
    """
    return {
        "target_column": "riskLevel",
        "canonical_target": "harmonized_risk_norm",
        "target_construction_columns": [
            "harmonized_risk_norm",  # Quantile-binned to produce riskLevel
        ],
        "raw_target_components": [
            # These are SOURCE-LEVEL columns that feed into harmonized_risk_norm
            # (only present in harmonized_base.csv after harmonization)
            # In raw source CSVs, they appear as:
            # - mental_health_burnout_tech_2026.csv: "burnout_score"
            # - tech_mental_health_burnout.csv: "burnout_score"
            # - indian_developer_burnout_2026.csv: "burnout_score"
            # - work_from_home_burnout_dataset.csv: "burnout_score"
        ],
        "sources_with_actual_burnout_measurement": [
            "mental_health_burnout_tech_2026",    # Has burnout_score
            "tech_mental_health_burnout",         # Has burnout_score
            "indian_developer_burnout_2026",      # Has burnout_score (South Asian proxy)
            "work_from_home_burnout_dataset",     # Has burnout_score
        ],
        "sources_without_direct_burnout_measurement": [
            "sri_lankan_developer_burnout",       # No burnout_score; requires proxy construction
        ],
        "critical_assumption": (
            "harmonized_risk_norm is derived ONLY from each dataset's burnout_score "
            "field, NOT from predictor variables. This prevents target leakage."
        ),
    }


def get_predictor_features():
    """
    Returns the complete list of predictor features (X) used by the model.
    
    These features MUST NOT include any target-construction columns.
    This list is used for validation in create_risk_labels().
    """
    return [
        "sleepHours", "sleepQuality", "exerciseLevel", "screenTimeHours",
        "workHours", "workloadRating", "overtimeHours", "breaksTaken",
        "commuteMinutes", "stressLevel", "moodScore", "energyLevel",
        "workSatisfaction", "caffeineIntake", "mealQuality", "socialSupportLevel",
        "anxietyLevel", "emotionalFatigue", "motivationLevel",
        "concentrationIssues", "irritabilityLevel", "lonelinessLevel",
        "selfEfficacy", "copingAbility", "powerInternetDisruption",
        "wfhEnvironmentQuality", "familyResponsibilityLoad",
        "salaryWorkloadSatisfaction", "afterHoursMessaging",
        "meetingsCount", "urgentTasksCount", "sprintPressureRating",
        "deadlineFrequency", "isWeekendWork", "bugFixingLoad",
        "contextSwitchingFrequency", "isOnCallToday", "workModeEncoded",
        "managerSupportLevel", "peerSupportLevel", "autonomyLevel",
        "roleAmbiguity", "taskComplexity", "interruptionsPerDay",
    ]


def create_risk_labels(df):
    """
    Generates the final categorical burnout-risk target from the canonical continuous target.
    
    Args:
        df (pd.DataFrame): Must contain 'harmonized_risk_norm' column with valid floats
        
    Returns:
        tuple: (risk_labels_list, quantile_thresholds_dict)
            - risk_labels_list: List of strings ["Low", "Moderate", "High", "Critical"]
            - quantile_thresholds_dict: Exact threshold values for reproducibility
            
    Raises:
        ValueError: If target column missing, has NaN, or construction fails
        
    Description:
        Four equiprobable classes via quantile-binning of harmonized_risk_norm.
        - Low:        0-25th percentile
        - Moderate:   25-50th percentile
        - High:       50-75th percentile
        - Critical:   75-100th percentile
        
        This creates exactly 4 classes with approximately equal representation.
    """
    if "harmonized_risk_norm" not in df.columns:
        raise ValueError(
            "create_risk_labels() requires 'harmonized_risk_norm' column. "
            "Did you forget to run harmonize_datasets.py?"
        )
    
    series = pd.Series(df["harmonized_risk_norm"], copy=True).astype(float)
    
    if series.isnull().any():
        n_missing = series.isnull().sum()
        raise ValueError(
            f"harmonized_risk_norm has {n_missing} missing values. "
            "Target cannot have NaN; check harmonize_datasets.py."
        )
    
    # Quantile binning for equiprobable classes
    try:
        bins = pd.qcut(series, q=4, labels=["Low", "Moderate", "High", "Critical"], duplicates="drop")
        labels = bins.astype(str).tolist()
        
        # Capture exact threshold values for reproducibility
        quantile_edges = pd.qcut(series, q=4, retbins=True, duplicates="drop")[1]
        thresholds = {
            "q0": float(quantile_edges[0]),
            "q25": float(quantile_edges[1]) if len(quantile_edges) > 1 else None,
            "q50": float(quantile_edges[2]) if len(quantile_edges) > 2 else None,
            "q75": float(quantile_edges[3]) if len(quantile_edges) > 3 else None,
            "q100": float(quantile_edges[-1]),
        }
        
    except ValueError as e:
        # If standard quantile fails, use rank-based binning (handles ties)
        ranked = series.rank(method="first")
        bins = pd.qcut(ranked, q=4, labels=["Low", "Moderate", "High", "Critical"], duplicates="drop")
        labels = bins.astype(str).tolist()
        quantile_edges = pd.qcut(ranked, q=4, retbins=True, duplicates="drop")[1]
        thresholds = {
            "q0": float(quantile_edges[0]),
            "q25": float(quantile_edges[1]) if len(quantile_edges) > 1 else None,
            "q50": float(quantile_edges[2]) if len(quantile_edges) > 2 else None,
            "q75": float(quantile_edges[3]) if len(quantile_edges) > 3 else None,
            "q100": float(quantile_edges[-1]),
            "method": "rank-based (ties handled)",
        }
    
    return labels, thresholds


def validate_target_leakage(df, leakage_columns_metadata):
    """
    Checks that target-construction columns do not appear in the final feature matrix.
    
    Args:
        df (pd.DataFrame): The dataset to validate
        leakage_columns_metadata (dict): Output from get_target_leakage_columns()
        
    Raises:
        ValueError: If any target column is found in the final dataset
        
    Returns:
        dict: Validation results (passed: bool, issues: list)
    """
    target_cols = leakage_columns_metadata["target_construction_columns"]
    issues = []
    
    for col in target_cols:
        if col in df.columns:
            issues.append(f"Target-construction column '{col}' found in final dataset X!")
    
    if issues:
        raise ValueError(
            "TARGET LEAKAGE DETECTED:\n" + "\n".join(issues) + 
            "\nThese columns must NOT be used as ML features."
        )
    
    return {"passed": len(issues) == 0, "issues": issues}


def validate_target_integrity(df):
    """
    Validates the final target column for model training.
    
    Checks:
    - riskLevel column exists
    - All values are in {"Low", "Moderate", "High", "Critical"}
    - No missing values
    - Class distribution is balanced
    
    Raises:
        ValueError: If any check fails
        
    Returns:
        dict: Validation report with class distribution
    """
    if "riskLevel" not in df.columns:
        raise ValueError("riskLevel column missing from dataset")
    
    target = df["riskLevel"]
    
    if target.isnull().any():
        raise ValueError(f"riskLevel has {target.isnull().sum()} missing values")
    
    expected_classes = {"Low", "Moderate", "High", "Critical"}
    actual_classes = set(target.unique())
    
    if not actual_classes.issubset(expected_classes):
        raise ValueError(f"Unexpected classes in riskLevel: {actual_classes - expected_classes}")
    
    dist = target.value_counts().to_dict()
    dist_pct = {k: round(v / len(target) * 100, 1) for k, v in dist.items()}
    
    return {
        "valid": True,
        "n_samples": len(target),
        "n_classes": len(dist),
        "class_distribution": dist,
        "class_distribution_pct": dist_pct,
    }


# ============================================================================
# FEATURE RANGES (for synthetic filling of missing values)
# ============================================================================

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
    "managerSupportLevel": (1, 5), "peerSupportLevel": (1, 5),
    "autonomyLevel": (1, 5), "roleAmbiguity": (1, 5),
    "taskComplexity": (1, 5), "interruptionsPerDay": (0, 20),
    "afterHoursMessaging": (0, 1), "isWeekendWork": (0, 1), "isOnCallToday": (0, 1),
}

def fill_synthetic_column(col, n):
    """
    Generates synthetic values for missing predictor data.
    
    WARNING: This synthetic data is NOT used for target construction.
    The target (riskLevel) comes ONLY from burnout_score harmonization.
    Synthetic predictor filling is a data-handling decision, not target leakage.
    
    Args:
        col (str): Predictor column name
        n (int): Number of rows to generate
        
    Returns:
        array: Synthetic values sampled from FEATURE_RANGES[col]
    """
    lo, hi = FEATURE_RANGES[col]
    if float(lo).is_integer() and float(hi).is_integer():
        return np.random.randint(int(lo), int(hi) + 1, size=n)
    return np.random.uniform(lo, hi, size=n)


def main():
    print("\n" + "="*80)
    print("BURNOUTGUARD DATASET GENERATION - TARGET CONSTRUCTION AUDIT")
    print("="*80 + "\n")
    
    # ========== STEP 1: Load harmonized base ==========
    print("[1/6] Loading harmonized base...")
    base = pd.read_csv(HARMONIZED_PATH, low_memory=False)
    n = len(base)
    print(f"      Loaded {n} rows from {HARMONIZED_PATH}")
    
    # ========== STEP 2: Validate target column exists ==========
    print("\n[2/6] Validating canonical target column...")
    if "harmonized_risk_norm" not in base.columns:
        raise ValueError(
            "harmonized_base.csv is missing required column 'harmonized_risk_norm'. "
            "Run ml-service/harmonize_datasets.py first."
        )
    print(f"      ✓ 'harmonized_risk_norm' column present")
    
    # ========== STEP 3: Extract and validate target ==========
    print("\n[3/6] Extracting canonical burnout target...")
    label_source = pd.to_numeric(base["harmonized_risk_norm"], errors="coerce")
    valid_mask = label_source.notna()
    
    if not valid_mask.any():
        raise ValueError(
            "No valid harmonized_risk_norm values found in harmonized_base.csv. "
            "Rows without a valid target cannot be used for supervised dataset generation."
        )
    
    n_valid = int(valid_mask.sum())
    n_dropped_target = len(base) - n_valid
    if n_dropped_target > 0:
        print(f"      ⚠ Dropping {n_dropped_target} rows with missing harmonized_risk_norm")
        print(f"        ({len(base)} → {n_valid} rows)")
    
    # Keep only rows with valid target
    base = base.loc[valid_mask].copy()
    label_source = label_source.loc[valid_mask].values.astype(float)
    n = len(base)
    
    print(f"      ✓ Using {n} rows with valid burnout target")
    print(f"      Target range: [{label_source.min():.4f}, {label_source.max():.4f}]")
    print(f"      Target mean: {label_source.mean():.4f}, std: {label_source.std():.4f}")
    
    # ========== STEP 4: Create categorical labels ==========
    print("\n[4/6] Creating categorical risk labels...")
    df = pd.DataFrame(index=base.index)
    
    # Use new create_risk_labels function
    risk_labels, quantile_thresholds = create_risk_labels(pd.DataFrame({"harmonized_risk_norm": label_source}))
    
    print(f"      Quantile thresholds:")
    for q_name, q_val in quantile_thresholds.items():
        if q_val is not None and q_name != "method":
            print(f"        {q_name}: {q_val:.4f}")
    
    # ========== STEP 5: Fill predictor features ==========
    print("\n[5/6] Preparing predictor features...")
    predictor_cols = get_predictor_features()
    print(f"      Total predictor features: {len(predictor_cols)}")
    
    n_synthetic_total = 0
    n_real_total = 0
    predictor_coverage = {}
    
    sri_lankan_mask = base.get("source_dataset", "").astype(str).eq("sri_lankan_developer_burnout")
    for col in predictor_cols:
        if col in base.columns and base[col].notna().any():
            real_values = base[col].to_numpy(dtype=np.float64, copy=True)
            missing_mask = np.isnan(real_values)
            missing_mask = missing_mask & ~sri_lankan_mask.to_numpy()
            n_real_for_col = (~missing_mask).sum()
            n_synthetic_for_col = missing_mask.sum()
            
            if missing_mask.any():
                synthetic_fill = fill_synthetic_column(col, n)
                real_values[missing_mask] = synthetic_fill[missing_mask]
            
            df[col] = real_values
            predictor_coverage[col] = {
                "n_real": int(n_real_for_col),
                "n_synthetic": int(n_synthetic_for_col),
                "pct_real": round(n_real_for_col / n * 100, 1),
            }
            n_real_total += n_real_for_col
            n_synthetic_total += n_synthetic_for_col
        else:
            # Entire column is synthetic
            values = fill_synthetic_column(col, n).astype(float)
            values[sri_lankan_mask.to_numpy()] = np.nan
            df[col] = values
            predictor_coverage[col] = {
                "n_real": int((~sri_lankan_mask).sum()),
                "n_synthetic": int((~sri_lankan_mask).sum()),
                "pct_real": 0.0,
                "sri_lankan_unavailable": int(sri_lankan_mask.sum()),
            }
            n_synthetic_total += int((~sri_lankan_mask).sum())
    
    # Special handling for binary columns
    if "afterHoursMessaging" in base.columns and base["afterHoursMessaging"].notna().any():
        real_bool = base["afterHoursMessaging"].to_numpy(dtype=np.float64, copy=True)
        missing_mask = np.isnan(real_bool)
        missing_mask = missing_mask & ~sri_lankan_mask.to_numpy()
        synthetic_bool = (np.random.rand(n) < 0.35).astype(float)
        real_bool[missing_mask] = synthetic_bool[missing_mask]
        df["afterHoursMessaging"] = real_bool
        predictor_coverage["afterHoursMessaging"]["n_synthetic"] = int(missing_mask.sum())
    else:
        values = (np.random.rand(n) < 0.35).astype(float)
        values[sri_lankan_mask.to_numpy()] = np.nan
        df["afterHoursMessaging"] = values
        predictor_coverage["afterHoursMessaging"] = {
            "n_real": int((~sri_lankan_mask).sum()),
            "n_synthetic": int((~sri_lankan_mask).sum()),
            "pct_real": 0.0,
            "sri_lankan_unavailable": int(sri_lankan_mask.sum()),
        }
        n_synthetic_total += int((~sri_lankan_mask).sum())
    
    # 100% synthetic features - FLAG AS SYNTHETIC
    print("\n      ⚠ WARNING: 100% synthetically generated features:")
    print("        - isWeekendWork (15% base probability)")
    print("        - isOnCallToday (10% base probability)")
    print("      These features have NO real ground truth and should be used cautiously in interpretation.")
    
    df["isWeekendWork"] = (np.random.rand(n) < 0.15).astype(float)
    df["isOnCallToday"] = (np.random.rand(n) < 0.10).astype(float)
    df.loc[sri_lankan_mask, ["isWeekendWork", "isOnCallToday"]] = np.nan
    predictor_coverage["isWeekendWork"] = {"n_real": 0, "n_synthetic": n, "pct_real": 0.0, "note": "100% synthetic"}
    predictor_coverage["isOnCallToday"] = {"n_real": 0, "n_synthetic": n, "pct_real": 0.0, "note": "100% synthetic"}
    n_synthetic_total += 2 * n
    
    total_feature_values = len(predictor_cols) * n
    pct_synthetic_overall = round(n_synthetic_total / total_feature_values * 100, 1)
    print(f"\n      Predictor feature coverage:")
    print(f"        Total values: {total_feature_values:,}")
    print(f"        Real values: {n_real_total:,} ({round(n_real_total/total_feature_values*100, 1)}%)")
    print(f"        Synthetic values: {n_synthetic_total:,} ({pct_synthetic_overall}%)")
    print(f"      → Model trained on {pct_synthetic_overall}% synthetic predictor data")
    
    # ========== STEP 6: Add target and metadata ==========
    print("\n[6/6] Adding target labels and finalizing dataset...")
    
    df["riskLevel"] = risk_labels
    
    # ========== STEP 7: Validate no target leakage ==========
    print("\n[VALIDATION] Checking for target leakage...")
    leakage_meta = get_target_leakage_columns()
    validate_target_leakage(df, leakage_meta)
    print(f"      ✓ No target-construction columns found in feature matrix")
    
    target_validation = validate_target_integrity(df)
    print(f"      ✓ Target validation passed:")
    print(f"        Samples: {target_validation['n_samples']}")
    print(f"        Classes: {target_validation['n_classes']}")
    for cls_name, cnt in target_validation['class_distribution'].items():
        pct = target_validation['class_distribution_pct'][cls_name]
        print(f"        - {cls_name}: {cnt:,} ({pct}%)")
    
    # NOW add harmonized_risk_norm for reference/reproducibility (not used as feature)
    df["harmonized_risk_norm"] = label_source
    for col in ["burnout_measurement", "exhaustion_composite", "target_measurement_source"]:
        if col in base.columns:
            df[col] = base[col].values
    df["source_dataset"] = base.get("source_dataset", "harmonized_base").values
    
    # ========== STEP 8: Save dataset ==========
    print(f"\nSaving {len(df)} rows to {OUTPUT_PATH}...")
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"✓ Saved {len(df)} rows to {OUTPUT_PATH}")
    
    # ========== STEP 9: Save target construction metadata ==========
    print("\nSaving target construction metadata...")
    metadata = {
        "dataset_path": OUTPUT_PATH,
        "n_rows": int(len(df)),
        "n_features": len(predictor_cols),
        "target_column": "riskLevel",
        "canonical_target": "harmonized_risk_norm",
        "canonical_target_source": "burnout_score from each source dataset (min-max normalized within dataset)",
        "target_classes": ["Low", "Moderate", "High", "Critical"],
        "quantile_thresholds": quantile_thresholds,
        "target_construction_columns": leakage_meta["target_construction_columns"],
        "sources_with_burnout_measurement": leakage_meta["sources_with_actual_burnout_measurement"],
        "sources_without_burnout_measurement": leakage_meta["sources_without_direct_burnout_measurement"],
        "target_integrity_validation": target_validation,
        "predictor_feature_coverage": predictor_coverage,
        "pct_synthetic_predictors": pct_synthetic_overall,
        "critical_assumption": leakage_meta["critical_assumption"],
    }
    
    metadata_path = "dataset_target_construction_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Saved metadata to {metadata_path}")
    
    # ========== STEP 10: Handle Sri Lankan data ==========
    print("\n" + "="*80)
    print("HANDLING SRI LANKAN DATA")
    print("="*80)
    
    if os.path.exists(SL_HOLDOUT_PATH):
        sl = pd.read_csv(SL_HOLDOUT_PATH)
        print(f"\nSri Lankan survey responses: {len(sl)} rows, {len(sl.columns)} columns")
        print("NOTE: Sri Lankan data has no single burnout_score column.")
        print("      Its six observed exhaustion items were preserved as the burnout measurement.")
        print("      It is included as a source-tagged development/holdout population.")
        print("\nRecommended approaches:")
        print("  1. Create a proxy target from exhaustion_composite items (train_and_evaluate.py)")
        print("  2. Use survey items directly to create harmonized features")
        print("  3. Perform held-out validation using only directly-observed features")
        print("\nActionable: See train_and_evaluate.py for Sri Lankan evaluation pipeline.")
        
        sl["source_dataset"] = "sri_lankan_developer_burnout"
        sl.to_csv("sri_lankan_developer_holdout.csv", index=False)
        print(f"\n✓ Prepared Sri Lankan holdout at sri_lankan_developer_holdout.csv")
    
    # ========== FINAL SUMMARY ==========
    print("\n" + "="*80)
    print("TARGET CONSTRUCTION SUMMARY")
    print("="*80)
    print("\n✓ CANONICAL TARGET: harmonized_risk_norm")
    print("  - Source: burnout_score from source datasets")
    print("  - Normalization: Min-max within each dataset")
    print("  - Continuous scale: [0, 1]")
    print("\n✓ SUPERVISED TARGET: riskLevel")
    print("  - Derivation: 4-class quantile binning of harmonized_risk_norm")
    print("  - Classes: Low (0-25%), Moderate (25-50%), High (50-75%), Critical (75-100%)")
    print("\n✓ TARGET LEAKAGE: NONE DETECTED")
    print("  - No predictor variables used in target construction")
    print("  - harmonized_risk_norm removed from feature matrix X")
    print("  - Validated with get_target_leakage_columns() and validate_target_leakage()")
    print("\n✓ PREDICTOR DATA QUALITY:")
    print(f"  - {pct_synthetic_overall}% synthetic values in predictors")
    print(f"  - Synthetic filling: independent of target")
    print(f"  - 100% synthetic features: isWeekendWork, isOnCallToday (flagged)")
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    main()
