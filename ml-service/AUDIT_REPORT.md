# BurnoutGuard ML Pipeline: Comprehensive Methodological Audit

**Audit Date:** 2026-09-01
**Status:** CRITICAL ISSUES IDENTIFIED - DO NOT PUBLISH IN CURRENT STATE

---

## Executive Summary

The BurnoutGuard ML pipeline has multiple **critical methodological flaws** that violate standard ML validation practices:

1. **SEVERE: Synthetic predictor generation without corresponding target leakage protection**
2. **SEVERE: Target leakage through global median imputation before train/test split**
3. **CRITICAL: Sri Lankan holdout data not actually held out (0 rows in dataset.csv)**
4. **CRITICAL: Preprocessing statistics fit on full dataset, applied to train/test**
5. **Major: No nested cross-validation; insufficient model validation**
6. **Major: Multiple inconsistent training pipelines (train.py vs train_and_evaluate.py)**
7. **Major: SHAP computed on synthetically-generated features**

---

## DETAILED AUDIT: FUNCTION-BY-FUNCTION

### 1. harmonize_datasets.py

#### Function: `minmax_norm(series)` (Lines 43-49)
**Current Behavior:**
- Min-max normalizes each source dataset's burnout_score to [0,1] WITHIN that dataset
- Does NOT normalize globally across all datasets
- Stated as intentional to preserve "within-source rank information"

**Problem:**
- Creates source-specific target scales that are then pooled
- When combined, datasets with different burnout score distributions get different effective weights
- Stated correctly in docstring but could be more transparent in paper

**Methodological Concern:**
- Medium: Acceptable if justified in paper, but reader may assume global harmonization

**Recommendation:**
- Document clearly: "harmonized_risk_norm is rank-based within each dataset, not clinically calibrated"
- Consider global quantile-based harmonization as alternative

---

#### Function: `harmonize_*()` functions (Lines 51-99)
**Current Behavior:**
- Maps external datasets' columns to BurnoutGuard schema
- Scales different measurement ranges into consistent output ranges
- Creates `harmonized_risk_norm` from original `burnout_score`

**Problem:**
- Assumes the source datasets' burnout_score is a valid gold standard
- No validation that these external burnout definitions match Sri Lankan context
- All 4 sources are global tech/WFH workers; only 1 is South Asian proxy (Indian)

**Methodological Concern:**
- Medium: External datasets may not be burnout-specific enough or may use different burnout definitions

**Recommendation:**
- In paper, explicitly state: "Harmonized target derived from burnout_score in external datasets; no ground truth validation against Sri Lankan clinical burnout assessment"

---

### 2. generate_dataset.py (CRITICAL ISSUES)

#### Function: `fill_synthetic_column(col, n)` (Lines 47-52)
**Current Behavior:**
- For missing values in predictor columns, generates random synthetic values from FEATURE_RANGES
- FEATURE_RANGES are hardcoded ranges (e.g., "sleepHours": (0, 12))
- Missing values filled with `np.random.uniform()` or `np.random.randint()`

**Problem:**
- **SEVERE DATA LEAKAGE**: Predictors that should correlate with burnout target are filled with noise
- Model learns to predict from 256K rows, but ~30-50% of many predictor columns are synthetic random values
- Synthetic features are completely independent of the actual burnout target
- Creates an **information mismatch**: target is real (from burnout_score), predictors are partially synthetic

**Methodological Danger:**
- **CRITICAL**: Model performance is meaningless because it's learning synthetic patterns
- **CRITICAL**: Cannot claim burnout prediction when predictors are synthetically generated
- **CRITICAL**: Validation on real data (Sri Lankan) will fail or show much lower performance
- **CRITICAL**: Published model may not transfer to any real population

**Recommended Change:**
- **Option A (Recommended)**: Exclude rows missing predictor values rather than synthetic filling
  - Report as "dataset cleaning: 256.8K → ~100-150K valid rows"
  - Resulting model validates on real predictor distributions
  
- **Option B**: If synthetic filling necessary, report accuracy separately as:
  - "Real-predictor accuracy: X%"
  - "Synthetic-filled accuracy: Y%"
  - Make clear model was trained on mixed real/synthetic data

---

#### Function: `main()` - Synthetic Predictor Generation (Lines 75-90)
**Current Behavior:**
```python
for col in FEATURE_RANGES:
    if col in base.columns and base[col].notna().any():
        real_values = base[col].to_numpy(dtype=np.float64, copy=True)
        missing_mask = np.isnan(real_values)
        if missing_mask.any():
            synthetic_fill = fill_synthetic_column(col, n)  # <-- SYNTHETIC!
            real_values[missing_mask] = synthetic_fill[missing_mask]
        df[col] = real_values
    else:
        df[col] = fill_synthetic_column(col, n)  # <-- ALL SYNTHETIC!
```

**Problem:**
- For columns not in a source dataset AT ALL, 100% of values are synthetic
- For columns with some missingness, those cells are random noise
- Example: "meetingsCount" likely not in most source datasets → all synthetic

**Methodological Danger:**
- **CRITICAL**: Many predictors may be entirely synthetic or mostly synthetic
- Model learns pseudo-features with no real predictive value
- Cross-validation on synthetic data is not meaningful validation

**Recommended Change:**
- Report: "For each predictor, % real vs. synthetic values before training"
- Consider separate validation on "real-only" subset
- In paper: "Model trained on 256.8K rows with 30-60% synthetic feature values; accuracy on real-data-only subset: X%"

---

#### Function: `main()` - Special Synthetic Features (Lines 85-86)
**Current Behavior:**
```python
df["isWeekendWork"] = (np.random.rand(n) < 0.15).astype(int)
df["isOnCallToday"] = (np.random.rand(n) < 0.10).astype(int)
```

**Problem:**
- These 2 predictors are **100% synthetically generated** with no real data
- Hard-coded probability (15% weekend, 10% on-call) is not based on any data
- Model cannot possibly learn any real pattern for these features
- Yet they will show up in SHAP importance rankings

**Methodological Danger:**
- **CRITICAL**: Non-zero SHAP importance for synthetic noise features indicates model is overfitting to noise
- If these features have high importance, model is unreliable
- Will mislead Sri Lankan developers about actual burnout drivers

**Recommended Change:**
- Remove `isWeekendWork` and `isOnCallToday` entirely OR
- Only include if you have real data from source datasets
- If including for "app completeness," mark as "placeholder" in metadata, don't train on them

---

#### Function: `main()` - Target Generation (Lines 61-65)
**Current Behavior:**
```python
label_source = pd.to_numeric(base["harmonized_risk_norm"], errors="coerce")
...
df["riskLevel"] = quantile_label(label_source.to_numpy(dtype=float, copy=False))
df["harmonized_risk_norm"] = label_source.to_numpy(dtype=float, copy=False)
```

**Problem:**
- Target is quantile-binned from harmonized_risk_norm (which itself came from burnout_score)
- Quantile binning is NOT stratified by dataset source
- Risk distribution may be very different across dataset sources (Indian vs WFH vs global tech)

**Methodological Concern:**
- Medium: Quantile binning may create imbalanced classes across sources
- Paper should report class distribution by source

**Recommended Change:**
- Report: Class distribution by source dataset
- Consider: Stratified quantile binning (bin separately per source, then merge)

---

#### Function: `main()` - Sri Lankan Holdout Preparation (Lines 99-103)
**Current Behavior:**
```python
if os.path.exists(SL_HOLDOUT_PATH):
    sl = pd.read_csv(SL_HOLDOUT_PATH)
    sl["source_dataset"] = "sri_lankan_developer_burnout"
    sl.to_csv("sri_lankan_developer_holdout.csv", index=False)
    print("Prepared Sri Lankan holdout at sri_lankan_developer_holdout.csv")
```

**Problem:**
- Sri Lankan CSV is loaded but **NOT merged into dataset.csv**
- `sri_lankan_developer_holdout.csv` is created but NOT used by train.py
- Audit check: 0 Sri Lankan rows in dataset.csv ✓ CONFIRMED
- **Reviewer concern #2 is TRUE: "Sri Lankan dataset may not actually participate correctly"**

**Methodological Danger:**
- **CRITICAL**: Sri Lankan data is completely isolated; never touches training pipeline
- train.py's `source_split()` call will find 0 holdout rows
- No actual external validation on Sri Lankan data
- Paper cannot claim "evaluated on Sri Lankan data" if it's not in the pipeline

**Recommended Change:**
- **MUST FIX BEFORE PUBLICATION**:
  1. Include Sri Lankan data in training dataset (with appropriate flag)
  2. Or properly hold it out from the START of pipeline
  3. Modify source_split() to ensure it's actually non-empty
  4. Add explicit error if holdout is empty: `assert len(sl_holdout) > 0, "Sri Lankan holdout empty!"`

---

### 3. train.py

#### Function: `clean()` in preprocess.py (Lines 46-56) [CALLED BY TRAIN.PY]
**Current Behavior:**
```python
def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Missing expected column: {col}")
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())  # <-- GLOBAL MEDIAN!
    ...
```

**Current Behavior in train.py main():**
```python
df = encode_labels(load_dataset("dataset.csv"))  # <-- calls clean() here
...
source_train, sl_holdout = source_split(df, SOURCE_TARGET)
train_df, temp_df = train_test_split(
    source_train,
    test_size=0.4,
    ...
)
```

**Problem:**
- **SEVERE LEAKAGE**: `clean()` fills missing values with GLOBAL median from FULL dataset
- This happens BEFORE train/test/cal/val split
- Validation set statistics leak into training set through imputation
- Test set median bleeds into training data for any missing values

**Methodological Danger:**
- **CRITICAL**: Preprocessing statistics computed on test data
- **CRITICAL**: Preprocessing not reproducible for production (need to recompute medians on new data)
- **CRITICAL**: Model evaluation on test set is OPTIMISTIC (test data info used in training preprocessing)

**Recommended Change:**
```python
df = encode_labels(load_dataset("dataset.csv"))
source_train, sl_holdout = source_split(df, SOURCE_TARGET)
train_df, temp_df = train_test_split(source_train, test_size=0.4, ...)
cal_df, val_df = train_test_split(temp_df, test_size=0.5, ...)

# FIT IMPUTATION ONLY ON TRAINING DATA
train_medians = train_df[FEATURE_COLUMNS].median()
for col in FEATURE_COLUMNS:
    train_df[col].fillna(train_medians[col], inplace=True)
    cal_df[col].fillna(train_medians[col], inplace=True)
    val_df[col].fillna(train_medians[col], inplace=True)
```

---

#### Function: `fit_best_model()` (Lines 215-250)
**Current Behavior:**
- **AFTER MY FIX**: Uses 50K subsample for GridSearchCV (good)
- Uses cv=2 folds in GridSearchCV
- No outer cross-validation
- Fits models on random subsample only, then selects best

**Problem:**
- **Major**: GridSearchCV cv=2 is too low; standard is cv=5
- **Major**: No nested cross-validation
  - Should have: Outer CV loop → Inner CV for hyperparameter tuning
  - Currently has: No outer loop at all
- **Major**: Best model selection on gridSearchCV.best_score_, not on holdout validation
- **Major**: No confidence intervals or p-values; no statistical testing

**Methodological Danger:**
- **Major**: Cannot report error bars or confidence intervals on final model
- **Major**: Model selection may overfit to training data
- **Major**: Paper cannot claim "5-fold cross-validation" if using cv=2 with no outer loop

**Recommended Change:**
```python
# Pseudocode: nested cross-validation
for outer_fold in StratifiedKFold(n_splits=5):
    train_inner, val_inner = outer_fold
    
    for candidate_model in candidates:
        inner_cv = GridSearchCV(candidate_model, param_grid, cv=3)
        inner_cv.fit(train_inner, y_train_inner)
        best_params = inner_cv.best_params_
        
        final_model = candidate_model.set_params(**best_params)
        final_model.fit(train_inner, y_train_inner)
        
        score_outer_fold = final_model.score(val_inner, y_val_inner)
        
    # Track best model and outer-fold score
```

---

#### Function: `main()` - Overall Train/Test Split (Lines 265-295)
**Current Behavior:**
```python
train_df, temp_df = train_test_split(source_train, test_size=0.4, ...)
cal_df, val_df = train_test_split(temp_df, test_size=0.5, ...)

X_train = train_df[FEATURE_COLUMNS]
...
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_cal_scaled = scaler.transform(X_cal)
X_val_scaled = scaler.transform(X_val)
```

**Problem:**
- Splits are 60% train, 20% cal, 20% val (OK, makes sense)
- BUT: train_df, cal_df, val_df still have missing values filled from GLOBAL median (see preprocess.py issue above)
- Scaler is fit correctly (only on training), but data leakage already happened in clean()

**Methodological Danger:**
- **Critical**: Preprocessing leakage undermines any validation metrics
- Even though scaler is fit correctly, missing value imputation is wrong

**Recommended Change:**
- Fix clean() to not use global median (see preprocess.py recommendation)

---

#### Function: `main()` - Sri Lankan Holdout (Lines 296-301)
**Current Behavior:**
```python
holdout_metrics = None
holdout_calibration = None
if len(sl_holdout) > 0:
    X_hold = sl_holdout[FEATURE_COLUMNS]
    y_hold = sl_holdout["riskLabel"]
    X_hold_scaled = scaler.transform(X_hold)
    holdout_metrics = evaluate(best_model, X_hold_scaled, y_hold)
```

**Problem:**
- **CRITICAL**: `len(sl_holdout) > 0` is ALWAYS FALSE (0 Sri Lankan rows in dataset.csv)
- Code path never executes
- holduout_metrics saved as None
- Metadata reports "externalSriLanka": null in final results

**Methodological Danger:**
- **CRITICAL**: Paper claims "evaluated on 314 Sri Lankan developers" but this code never runs
- **CRITICAL**: Reviewer concern #2 is exactly right
- External validation on genuine held-out data does not actually happen

**Recommended Change:**
- FIX CRITICAL: Include actual Sri Lankan data in dataset
- Add assertion: `assert len(sl_holdout) > 0, "ERROR: Sri Lankan holdout is empty!"`
- If assertion fails, entire pipeline breaks → forces fixing data flow

---

### 4. train_and_evaluate.py (ALTERNATIVE PIPELINE)

#### Function: `main()` - 5-Fold Cross-Validation (Lines 57-80)
**Current Behavior:**
- Uses StratifiedKFold(n_splits=5) ✓ CORRECT
- Trains LogisticRegression with C hyperparameter tuning
- Reports mean and std of F1 and AUC across 5 folds

**Assessment:**
- **GOOD**: Proper cross-validation methodology
- **BUT**: Different from train.py (train.py uses ensemble, this uses LogisticRegression only)
- **BUT**: This pipeline requires "Untitled_form.csv" which doesn't exist

**Methodological Concern:**
- Medium: Two different training pipelines with different models/results
- Paper should clarify which one is "final"

---

#### Function: `main()` - Sri Lankan Evaluation (Lines 85-140)
**Current Behavior:**
```python
survey = pd.read_csv(SURVEY_PATH)  # SURVEY_PATH = "Untitled_form.csv"
...
exhaustion_items = [
    "How often do you feel tired?",
    ...
]
survey["exhaustion_composite"] = survey[exhaustion_items].mean(axis=1)
survey["y_proxy"] = pd.qcut(survey["exhaustion_composite"], 4, labels=[0, 1, 2, 3])

X_holdout = pd.DataFrame(index=survey.index, columns=feature_cols, dtype=float)
for c in feature_cols:
    X_holdout[c] = train_medians[c]  # <-- FILLS WITH TRAINING SET MEDIANS!

X_holdout["sleepHours"] = survey["Average sleep hours per night"]
X_holdout["workHours"] = survey["Average working hours per day"]
...
# Only 9 features directly observed, rest are training medians
```

**Problem (EXTREMELY CRITICAL):**
- **SEVERE LEAKAGE**: X_holdout is initialized with training set medians
- Only ~9 features are replaced with actual survey values
- Remaining ~40 features are training set statistics imposed on Sri Lankan data
- **This is NOT held-out validation, this is model projection**
- Sri Lankan feature distribution is replaced with training distribution
- Model's evaluation on Sri Lankan data is meaningless

**Methodological Danger:**
- **CRITICAL**: Model can only "validate" if its learned patterns happen to generalize with training-set-medians-filled data
- **CRITICAL**: Any model would score decently if majority of features are training medians
- **CRITICAL**: Cannot claim external validation or domain transfer
- **CRITICAL**: Performance on this "holdout" is NOT performance on real Sri Lankan data

**Recommended Change:**
- **Approach 1 (Proper Held-Out Validation):**
  ```
  - Include ONLY the ~9 directly-observed features
  - Report model accuracy using ONLY real features
  - Label clearly: "Limited-feature validation: 9/47 features directly observed"
  - DO NOT fill missing features with training medians
  ```
  
- **Approach 2 (Better Harmonization):**
  ```
  - Ask Sri Lankan survey to capture ALL 47 features
  - Include all 314 responses in training data properly (with source_dataset flag)
  - Use proper source-aware cross-validation: train on 3 sources, validate on SL
  - Report separate validation metrics for Sri Lankan-only subset
  ```

---

#### Function: `main()` - Target Generation for Sri Lankan (Line 112)
**Current Behavior:**
```python
survey["exhaustion_composite"] = survey[exhaustion_items].mean(axis=1)
survey["y_proxy"] = pd.qcut(survey["exhaustion_composite"], 4, labels=[0, 1, 2, 3])
```

**Problem:**
- Creates a proxy target from 6 exhaustion items via averaging + quantile binning
- **This is a different target variable than the main model** (which uses harmonized_risk_norm → quantiles)
- Model was trained to predict harmonized_risk_norm-based classes
- Now being evaluated on exhaustion-composite-based classes
- These may have very different class boundaries

**Methodological Danger:**
- **Major**: Apples vs. oranges comparison
- **Major**: Cannot claim "model validates on Sri Lankan data" if using different target definition
- If performance is poor, unclear if it's because model is bad or target is different

**Recommended Change:**
- Use same target generation as main pipeline: map exhaustion items to harmonized_risk_norm scale if possible
- Or clearly label this as "alternative target definition validation"

---

### 5. explain.py

#### Function: `compute_global_feature_importance()` (Lines 128-167)
**Current Behavior:**
- Computes SHAP values using:
  - Tree models: `shap.TreeExplainer(model)`
  - Linear models: `shap.Explainer(model, background)` with training data as background
- Takes mean absolute SHAP across samples

**Problem:**
- **Critical**: SHAP is computed on features that are partially/fully synthetic (see generate_dataset.py)
- Example: "isWeekendWork" and "isOnCallToday" are 100% synthetic noise
  - SHAP values for these will be meaningless
  - But they will still appear in importance rankings
- **Major**: Background samples from training data that itself was contaminated with global-median imputation
- **Major**: No uncertainty quantification on SHAP values (no confidence intervals)

**Methodological Danger:**
- **Critical**: Publishing SHAP as "feature importance for burnout" is misleading if features are synthetic
- **Critical**: Paper might claim "sleep hours and overtime are most important for burnout" but these are partially synthetic
- **Critical**: Cannot guide policy/interventions based on importance of synthetic features

**Recommended Change:**
- Report: "% synthetic vs. real for each feature" alongside SHAP importance
- Only compute/visualize SHAP for features with ≥80% real data
- Mark synthetic features with ⚠ symbol in all figures
- In paper: "SHAP interpretations are limited to features with real observed data"

---

#### Function: `explain_prediction()` (Lines 71-113)
**Current Behavior:**
- Takes a single test sample
- Scales it using provided scaler
- Computes SHAP values for that sample
- Sorts by abs SHAP and creates plain-language explanations

**Problem:**
- For synthetic features (isWeekendWork, etc.), SHAP values are random
- Explanation "isWeekendWork is increasing your burnout risk" is nonsensical if feature is random
- No indication that explanations may be unreliable for synthetic features

**Methodological Danger:**
- **Major**: Backend predictions using this will show false confidence in explanations
- **Major**: Users (Sri Lankan developers) may follow advice based on synthetic feature importance
- Example: "Take weekends off" would be given as advice, but this feature is 100% synthetic noise

**Recommended Change:**
- Return confidence score with each explanation
- Filter explanations: only show for features with ≥80% real data
- Add disclaimer: "Explanations based on partially synthetic features may be unreliable"

---

### 6. preprocess.py

#### Function: `source_split()` (Lines 95-98)
**Current Behavior:**
```python
def source_split(df, holdout_source="sri_lankan_developer_burnout"):
    if "source_dataset" not in df.columns:
        return df, df.iloc[0:0].copy()
    holdout_mask = df["source_dataset"].astype(str).str.lower().eq(holdout_source.lower())
    return df.loc[~holdout_mask].copy(), df.loc[holdout_mask].copy()
```

**Current Result:**
- `source_split(df, "sri_lankan_developer_burnout")` returns (256,800 rows, 0 rows)
- **Holdout is ALWAYS empty**
- No error or warning raised

**Methodological Danger:**
- **Critical**: Code silently fails to hold out Sri Lankan data
- Paper claims "held out for external validation" but this never happens
- Reviewer would immediately catch this

**Recommended Change:**
```python
def source_split(df, holdout_source="sri_lankan_developer_burnout"):
    ...
    holdout = df.loc[holdout_mask].copy()
    
    # EXPLICIT ASSERTION
    if len(holdout) == 0:
        print(f"WARNING: Requested holdout source '{holdout_source}' not found!")
        print(f"Available sources: {df['source_dataset'].unique().tolist()}")
        raise ValueError(f"Holdout source '{holdout_source}' is empty")
    
    return df.loc[~holdout_mask].copy(), holdout
```

---

#### Function: `load_dataset()` (Lines 39-48)
**Current Behavior:**
```python
def load_dataset(path: str = "dataset.csv") -> pd.DataFrame:
    df = pd.read_csv(path)
    return clean(df)  # <-- CALLS CLEAN() WITH GLOBAL MEDIAN
```

**Problem:**
- Combines loading with preprocessing
- Not flexible for different preprocessing pipelines
- Implies preprocessing is automatic/universal

**Methodological Danger:**
- **Medium**: Conflates data loading with preprocessing
- Makes it hard to apply different imputation strategies in different contexts

**Recommended Change:**
```python
def load_dataset(path: str = "dataset.csv") -> pd.DataFrame:
    df = pd.read_csv(path)
    return df  # JUST LOAD

def preprocess_for_training(df, fit_medians_from=None):
    """
    fit_medians_from: if None, fit medians from df itself (LEAK!)
                      if DataFrame, fit medians from that data only (CORRECT)
    """
    if fit_medians_from is None:
        medians = df[FEATURE_COLUMNS].median()
    else:
        medians = fit_medians_from[FEATURE_COLUMNS].median()
    
    df_clean = df.copy()
    for col in FEATURE_COLUMNS:
        df_clean[col].fillna(medians[col], inplace=True)
    return df_clean, medians
```

---

### 7. experiments/shap_stability.py

#### Function: `run_once()` (Lines 32-50)
**Current Behavior:**
```python
def run_once(seed, df, model_name, model_params):
    df_encoded = encode_labels(df)
    X_train, X_test, y_train, y_test, scaler = split_and_scale(df_encoded)
    
    rng = np.random.RandomState(seed)
    idx = rng.choice(len(X_train), size=len(X_train), replace=True)
    X_boot = X_train[idx]  # Bootstrap resample
    y_boot = y_train.iloc[idx]
    
    model = build_fixed_model(model_name, model_params)
    model.fit(X_boot, y_boot)  # Train on BOOTSTRAP
    
    background = X_train[:100]  # <-- Background from training set
    importance = compute_global_feature_importance(model, X_train[:200], background)
    return importance
```

**Problem:**
- **Major**: SHAP stability measured by training on bootstrap resamples
- Not measuring stability across different data splits or random seeds in preprocessing
- Background is X_train which is contaminated by global-median imputation from preprocess.py
- "Stability" here may reflect stability of noise, not stability of true features

**Methodological Danger:**
- **Major**: SHAP "stability" score is not representative of real-world instability
- **Major**: If synthetic features dominate, "stability" may be measuring stability of noise

**Recommended Change:**
- Implement proper cross-validation stability:
  ```
  for k_fold in StratifiedKFold(n_splits=5):
      train_data, val_data = k_fold
      model.fit(train_data)
      importance_k = compute_shap_importance(model, val_data)
      all_importance.append(importance_k)
  ```
- Report: "SHAP ranking correlation across 5-fold CV: mean X, std Y"

---

### 8. experiments/leakage_comparison.py

#### Assessment
**Current Behavior:**
- Compares model metrics and SHAP rankings before/after applying a data leakage fix
- Requires manual backup of metadata before retraining

**Problem:**
- Script exists but unclear if the leakage fix was actually applied
- No comment in generate_dataset.py indicating which leakage was supposedly fixed
- Based on code review, the MAJOR leakage (synthetic predictors) is still present

**Methodological Danger:**
- **Major**: Script suggests awareness of leakage but no evidence it was fixed
- **Major**: Could be performative (appears to care about leakage but doesn't actually fix it)

**Recommended Change:**
- Apply actual fixes to generate_dataset.py (see recommendations above)
- Run this comparison script
- Report results in paper: "Before fix: X%, After fix: Y%"
- If results are similar, that's fine - means synthetic filling didn't hurt much
- If results drop significantly, need different approach to missing data

---

### 9. experiments/leave_one_out.py

#### Function: `train_eval()` (Line 102)
**Current Behavior:**
```python
best_name, best_model, _ = fit_best_model(X_train_scaled, y_train, X_val_scaled, y_val)
```

**Problem:**
- Calling `fit_best_model()` with 4 arguments
- But `train.py fit_best_model()` signature is: `def fit_best_model(X_train, y_train)` (2 args)
- **Script will CRASH when run**
- Suggests this experiment is broken/outdated

**Methodological Danger:**
- **Major**: Code is non-functional; cannot generate leave-one-out results
- **Major**: If this analysis was run, it was on an older version of fit_best_model

**Recommended Change:**
```python
best_name, best_model, _ = fit_best_model(X_train_scaled, y_train)  # CORRECT SIGNATURE
# Then evaluate on val_df separately
y_pred = best_model.predict(X_val_scaled)
metrics = evaluate(best_model, X_val_scaled, y_val)
```

---

### 10. Raw Datasets / Sri Lankan Data

#### Observation
```
ml-service/raw_datasets/sri_lankan_developer_burnout.csv
  - 314 rows (genuine survey responses)
  - 18 columns (survey questions, metadata)
  - NO burnout_score column
  - Cannot be harmonized with other datasets
  - NOT included in harmonized_base.csv
  - NOT included in dataset.csv
```

**Problem:**
- Sri Lankan data exists but is isolated from main pipeline
- generate_dataset.py creates separate file but doesn't include it in dataset.csv
- train.py expects to find it via source_split() but it's not there

**Methodological Danger:**
- **Critical**: Paper claims to evaluate on Sri Lankan data but data never enters pipeline
- **Critical**: This is the core reviewer concern #2

**Recommended Change:**
- **FIX CRITICAL ISSUE**:
  1. Add burnout target to Sri Lankan CSV or use exhaustion_composite as proxy
  2. Include Sri Lankan rows in harmonized_base.csv/dataset.csv with source_dataset="sri_lankan_developer_burnout"
  3. Use source-aware train/val split: train on 4 external sources, validate on Sri Lankan
  4. Ensure source_split() returns non-empty holdout
  5. Add error if empty: `assert len(holdout) > 0`

---

## SUMMARY TABLE: CRITICAL ISSUES

| Issue | File | Function | Severity | Fix Complexity |
|-------|------|----------|----------|-----------------|
| Synthetic predictors without target leakage protection | generate_dataset.py | fill_synthetic_column() | CRITICAL | High |
| Global median imputation before train/test split | preprocess.py | clean() | CRITICAL | Medium |
| Sri Lankan data not in dataset.csv | generate_dataset.py | main() | CRITICAL | Medium |
| Silent empty holdout (no error) | preprocess.py | source_split() | CRITICAL | Low |
| 100% synthetic features (isWeekendWork, isOnCallToday) | generate_dataset.py | main() | CRITICAL | Low |
| No nested cross-validation | train.py | fit_best_model() | MAJOR | High |
| Sri Lankan holdout filled with training medians | train_and_evaluate.py | main() | MAJOR | Medium |
| SHAP on synthetic features is meaningless | explain.py | compute_global_feature_importance() | MAJOR | Medium |
| Multiple inconsistent training pipelines | train.py + train_and_evaluate.py | main() | MAJOR | High |
| Different target definitions (harmonized vs exhaustion) | train_and_evaluate.py | main() | MAJOR | Medium |
| leave_one_out.py has wrong function signature | experiments/leave_one_out.py | train_eval() | MAJOR | Low |
| No baseline model (simple rules) | — | — | MAJOR | High |
| SHAP not causal but may be interpreted as such | — | — | MEDIUM | Low (doc only) |
| Quantile binning on global distribution | generate_dataset.py | main() | MEDIUM | Low |
| Only 2 CV folds in GridSearchCV | train.py | fit_best_model() | MEDIUM | Low |
| External datasets not burnout-specific | harmonize_datasets.py | main() | MEDIUM | Low (doc only) |

---

## REVIEWER CHECKLIST

**Reviewer Concern #1: Target leakage/circularity**
- ✓ CONFIRMED: Predictors partially synthetic, target real → mismatch
- ✓ CONFIRMED: Global median imputation before split
- ⚠ NEEDS FIX: Exclude synthetic predictors or report accuracy separately

**Reviewer Concern #2: Sri Lankan data not in pipeline**
- ✓ CONFIRMED: 0 Sri Lankan rows in dataset.csv
- ✓ CONFIRMED: generate_dataset.py creates separate file but doesn't include
- ✓ CONFIRMED: source_split() silently returns empty
- ⚠ NEEDS FIX: Include Sri Lankan data or assert non-empty

**Reviewer Concern #3: Model evaluation relies on single 80/20 split**
- ✓ CONFIRMED: train.py uses single 60/20/20 split, no outer CV
- ✓ CONFIRMED: No error bars or confidence intervals
- ⚠ NEEDS FIX: Implement nested cross-validation

**Reviewer Concern #4: No robust cross-validation reporting**
- ✓ CONFIRMED: Only 2 CV folds in GridSearchCV
- ✓ CONFIRMED: No 5-fold CV in main pipeline (train.py)
- ✓ CONFIRMED: No confidence intervals reported
- ⚠ NEEDS FIX: Use proper nested CV, report std dev

**Reviewer Concern #5: Per-class performance (especially Critical recall)**
- ⚠ UNCLEAR: train.py reports macro metrics but not per-class recall by risk level
- ⚠ NEEDS VERIFICATION: Check metadata.json for Critical-class recall

**Reviewer Concern #6: No baseline**
- ✓ CONFIRMED: No simple rule-based baseline (e.g., "always predict Moderate")
- ✓ CONFIRMED: No random classifier baseline
- ⚠ NEEDS FIX: Add baseline: "predict most common class" and "random stratified"

**Reviewer Concern #7: Preprocessing leak**
- ✓ CONFIRMED: Global median imputation before split in preprocess.py
- ✓ CONFIRMED: NO per-feature leak audit in train.py
- ⚠ NEEDS FIX: Reorder preprocessing after split

**Reviewer Concern #8: SHAP not causal**
- ⚠ MEDIUM: Paper must explicitly state SHAP is correlational, not causal
- ⚠ NEEDS: Add disclaimer in methodology section

**Reviewer Concern #9: Multiple inconsistent pipelines**
- ✓ CONFIRMED: train.py (ensemble, LightGBM) vs train_and_evaluate.py (LogisticRegression, 5-fold)
- ✓ CONFIRMED: Different models, different validation approaches
- ✓ CONFIRMED: Unclear which is "final"
- ⚠ NEEDS FIX: Unify pipelines or clearly document differences

**Reviewer Concern #10: No genuine Sri Lankan held-out evaluation**
- ✓ CONFIRMED: Sri Lankan data not in training dataset
- ✓ CONFIRMED: train_and_evaluate.py fills missing features with training medians
- ✓ CONFIRMED: No real held-out evaluation on Sri Lankan data
- ⚠ NEEDS FIX: Proper held-out evaluation or remove claim from paper

---

## RECOMMENDED PRIORITY FIXES (Before Publication)

### TIER 1 (MUST FIX - Blocks Publication)

1. **Fix Sri Lankan holdout integration**
   - Include Sri Lankan rows in dataset.csv with proper source flag
   - Or properly keep separate and ensure pipeline uses them
   - Add assertion in source_split()
   
2. **Fix global median imputation**
   - Move clean() to AFTER train/test split
   - Fit medians only on training data
   
3. **Fix synthetic predictor issue**
   - Either: Exclude rows with missing predictors (reduces dataset size)
   - Or: Report accuracy separately for "synthetic-filled" vs "real-only" subsets
   
4. **Fix train.py SHAP on synthetic features**
   - Report: % synthetic vs real for each feature
   - Only visualize SHAP for features with ≥80% real data

### TIER 2 (SHOULD FIX - Strengthens Validation)

5. Implement nested cross-validation (5-fold outer, 3-fold inner)
6. Add baseline models (majority class, random, simple rules)
7. Increase GridSearchCV cv folds from 2 to 5
8. Ensure leave_one_out.py works with current fit_best_model signature
9. Unify train.py and train_and_evaluate.py into single pipeline

### TIER 3 (NICE TO HAVE - Improves Clarity)

10. Add explicit SHAP causality disclaimer in paper
11. Stratify quantile binning by source dataset
12. Add per-class performance table (esp. Critical recall)
13. Document external datasets' burnout definitions

---

## CONCLUSION

**The BurnoutGuard pipeline has critical flaws that must be resolved before publication. The most severe issues are:**

1. **Synthetic predictors mixed with real targets** - undermines all model interpretations
2. **Sri Lankan data not actually in pipeline** - central reviewer concern unresolved  
3. **Preprocessing leakage** - training data contaminated with test information
4. **No meaningful cross-validation** - cannot assess generalization error

**Current model evaluation is NOT VALID.**  A reviewer would immediately reject this work as-is.

**Estimated effort to fix:** 1-2 weeks for Tier 1, + 1-2 weeks for Tier 2

**Do not proceed with adding features or improving explanations until these foundations are fixed.**
