# Sri Lankan Survey Re-Harmonization — Results Report

Pipeline run: `harmonize_datasets.py` → `generate_dataset.py` → `train.py` (model `v2.22-lightgbm`).
All new artifacts are saved under `*_v2.json` / `*_v2.md` filenames in `models/` and
`experiments/results/`; the previous authoritative run's `metadata.json`,
`cv_results.json`, `baseline_results.json`, `bootstrap_comparisons.json`,
`evaluation_results.json`, `shap_results.json`, and `duplicate_audit*` files are
restored to their original (pre-this-run) content and remain reproducible/auditable.

## 1. Feature coverage (Sri Lankan rows, all 314 — same real/imputed status holds for the 63-row external holdout)

| feature | status |
|---|---|
| sleepHours | real |
| sleepQuality | real |
| exerciseLevel | real |
| screenTimeHours | real |
| workHours | real |
| workloadRating | real |
| overtimeHours | real |
| breaksTaken | real |
| commuteMinutes | real |
| stressLevel | real |
| moodScore | imputed (no survey question) |
| energyLevel | real |
| workSatisfaction | real |
| caffeineIntake | real |
| mealQuality | real |
| socialSupportLevel | real |
| anxietyLevel | real |
| emotionalFatigue | real |
| motivationLevel | real |
| concentrationIssues | real |
| irritabilityLevel | real |
| lonelinessLevel | imputed (no survey question) |
| selfEfficacy | real |
| copingAbility | real |
| powerInternetDisruption | real |
| wfhEnvironmentQuality | imputed (no survey question) |
| familyResponsibilityLoad | imputed (no survey question) |
| salaryWorkloadSatisfaction | real |
| afterHoursMessaging | real (rescaled from 1-5 frequency to 0-1) |
| meetingsCount | imputed (no survey question) |
| urgentTasksCount | real |
| sprintPressureRating | real |
| deadlineFrequency | imputed (no survey question) |
| isWeekendWork | real |
| bugFixingLoad | imputed (no survey question) |
| contextSwitchingFrequency | real |
| isOnCallToday | real |
| workModeEncoded | real |
| managerSupportLevel | real |
| peerSupportLevel | real |
| autonomyLevel | real |
| roleAmbiguity | real (reverse-scored from role-clarity item) |
| taskComplexity | real |
| interruptionsPerDay | imputed (no survey question) |

**36/44 features directly observed (was 7/44).**

Note: the task brief's expectation of exactly 6 unmapped features
(`meetingsCount`, `bugFixingLoad`, `deadlineFrequency`, `interruptionsPerDay`,
`wfhEnvironmentQuality`, `moodScore`) was checked against the actual CSV header
and found incomplete — the survey also has no question corresponding to
`lonelinessLevel` or `familyResponsibilityLoad`. The true unmapped count is 8,
yielding 36/44 (not ~38/44) directly observed.

## 2. Table 6.5a equivalent — Repeated 5-fold × 3-repeat CV (development data only, model `v2.22-lightgbm` run)

| Model | Accuracy | Weighted F1 | ROC-AUC |
|---|---|---|---|
| LogisticRegression | 0.6216 ± 0.0026 | 0.6196 ± 0.0027 | 0.8542 ± 0.0013 |
| RandomForest | 0.6760 ± 0.0017 | 0.6758 ± 0.0019 | 0.8916 ± 0.0006 |
| XGBoost | 0.6940 ± 0.0019 | 0.6949 ± 0.0018 | 0.9032 ± 0.0009 |
| **LightGBM (selected)** | **0.6956 ± 0.0019** | **0.6965 ± 0.0018** | **0.9037 ± 0.0007** |
| DummyStratified (baseline) | 0.2512 ± 0.0020 | 0.2512 ± 0.0020 | 0.5007 ± 0.0013 |
| DummyMostFrequent (baseline) | 0.2612 ± 0.0000 | 0.1082 ± 0.0000 | 0.5000 ± 0.0000 |
| ComputationalHeuristic (baseline) | 0.5166 ± 0.0028 | 0.5175 ± 0.0027 | 0.6770 ± 0.0019 |

Source: `models/cv_results_v2.json`, `models/baseline_results_v2.json`.

## 3. Table 6.5b equivalent — Internal vs. Sri Lankan external holdout (selected model: LightGBM `v2.22`)

| Evaluation | n | Macro F1 | ROC-AUC |
|---|---|---|---|
| Internal (final validation subset) | 51,411 | 0.6795 | 0.8946 |
| Sri Lankan external holdout | 63 | 0.3046 | 0.7501 |

Source: `models/metadata_v2.json` → `validation.internalFinalValidation` / `validation.externalSriLanka`.

## 4. Table 6.5c equivalent — Per-class precision/recall/F1 (internal holdout, n=51,411)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Low | 0.7397 | 0.7678 | 0.7535 | 13,429 |
| Moderate | 0.5397 | 0.5455 | 0.5426 | 12,726 |
| High | 0.5949 | 0.5867 | 0.5908 | 12,549 |
| Critical | 0.8473 | 0.8155 | 0.8311 | 12,707 |

Sri Lankan external holdout per-class (n=63, for reference — very small per-class support):

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Low | 0.0625 | 1.0000 | 0.1176 | 1 |
| Moderate | 0.2500 | 0.1429 | 0.1818 | 7 |
| High | 0.3333 | 0.2632 | 0.2941 | 19 |
| Critical | 0.7143 | 0.5556 | 0.6250 | 36 |

## 5. SHAP stability (seeds 42/43/44, LightGBM, bootstrap resamples of development training data)

Top-10 global features, identical ranking across all 3 seeds:

1. stressLevel
2. overtimeHours
3. workHours
4. anxietyLevel
5. screenTimeHours
6. caffeineIntake
7. sleepHours
8. wfhEnvironmentQuality
9. socialSupportLevel
10. workloadRating

All 10 features have a 100% appearance rate across seeds — the ranking is **identical to the prior run** (unchanged), even though 29 additional Sri Lankan features are now real rather than imputed. This is expected: the SHAP stability check samples from development training data (154,230 rows), which is >99.8% non-Sri-Lankan rows; the newly-real Sri Lankan features are too small a fraction of the training population to shift global rankings. Note `wfhEnvironmentQuality` (#8) is still 0% real for every Sri Lankan row (imputed) — its importance is driven entirely by the four non-Sri-Lankan source datasets, not by Sri Lankan data.

Source: `models/shap_results_v2.json` → `stability`.

## 6. Delta vs. previous authoritative run

Previous authoritative run (`models/model_v2.21-lightgbm.pkl`, restored `models/metadata.json`):
macro F1 0.6785 internal / 0.0515 external, ROC-AUC 0.8939 internal / 0.5036 external.

New run (`v2.22-lightgbm`, this survey re-harmonization):
macro F1 0.6795 internal / 0.3046 external, ROC-AUC 0.8946 internal / 0.7501 external.

| Metric | Previous | New | Change |
|---|---|---|---|
| Internal macro F1 | 0.6785 | 0.6795 | +0.0010 |
| Internal ROC-AUC | 0.8939 | 0.8946 | +0.0007 |
| External (Sri Lankan) macro F1 | 0.0515 | 0.3046 | +0.2531 |
| External (Sri Lankan) ROC-AUC | 0.5036 | 0.7501 | +0.2465 |

Internal (non-Sri-Lankan-dominated) metrics are essentially unchanged, as expected — the training population and its feature realism did not change. The Sri Lankan external holdout metrics rose substantially: macro F1 roughly 6x higher, ROC-AUC moved from chance level (0.50) to well above chance (0.75). This is consistent with the holdout evaluation now running on a model that receives 36/44 real Sri Lankan feature values per row instead of 7/44, rather than mostly training-population medians.

## 7. Methodology issues found in Task 3.3

- **`isWeekendWork` / `isOnCallToday` were being forced to NaN for Sri Lankan rows regardless of real data** (`generate_dataset.py`, previously lines 463-465): after the harmonization fix populated real Yes/No answers for these two columns, a later hardcoded block in `generate_dataset.py` unconditionally overwrote both columns for all rows with synthetic values and then set Sri Lankan rows back to NaN — discarding the real values before they ever reached `dataset.csv`. This was fixed as part of Task 2 (the block now only synthesizes these columns when they weren't already populated with real values upstream). Without this fix, 2 of the 36 "real" features reported above would silently have reverted to imputed for all 314 Sri Lankan rows.
- **`harmonize_datasets.py`'s `TARGET_COLUMNS` list omitted the entire "Work Pattern Monitoring" feature group** (`meetingsCount`, `urgentTasksCount`, `sprintPressureRating`, `deadlineFrequency`, `isWeekendWork`, `bugFixingLoad`, `contextSwitchingFrequency`, `isOnCallToday`, `managerSupportLevel`, `peerSupportLevel`, `autonomyLevel`, `roleAmbiguity`, `taskComplexity`, `interruptionsPerDay`). Because `main()` selects `combined[ordered_cols]` where `ordered_cols` is built from `TARGET_COLUMNS`, any of these columns that a harmonizer function populated (e.g. the original Sri Lankan mapping already computed `sprintPressureRating`, `urgentTasksCount`, and `contextSwitchingFrequency`) were silently dropped before being written to `harmonized_base.csv`, and were then re-generated as 100%-synthetic-or-NaN by `generate_dataset.py`. This means **even the original 3 already-implemented Work Pattern features were never actually reaching the Sri Lankan holdout as real data before this task**, despite being computed in `harmonize_sri_lankan_survey()`. This was fixed as part of Task 2 by extending `TARGET_COLUMNS` to the full 44-feature list.
- **Preprocessing leakage (the AUDIT_REPORT.md Tier-1 finding of global-median imputation before train/test split) is fixed in the current `train.py`/`preprocess.py`**, contrary to what a reader of `AUDIT_REPORT.md` alone would conclude. `preprocess.clean()` no longer imputes at all (it only validates schema), and `train.py`'s `build_preprocessing_pipeline()` puts `SimpleImputer`+`StandardScaler` inside a per-fold-fitted `sklearn` `Pipeline`/`ColumnTransformer`, fit exclusively on each CV fold's or each named split's (`train_df`) training rows — confirmed by reading `cross_validate_model()` (fits fold_pipeline only on `X_fold_train`) and `main()` (fits the final pipeline on `X_train` and only calls `.transform`/`.predict` on `X_cal`, `X_val`, and the Sri Lankan holdout). No global-dataset statistics leak into any split. This audit finding is stale relative to the current codebase and should not be repeated as-is in the thesis without noting it was resolved.
- **The Sri Lankan holdout split is genuinely stratified and non-empty**: `create_sri_lankan_holdout()` produced 314 total → 251 development / 63 holdout (≈80/20), with class distribution preserved (holdout: Low 1, Moderate 7, High 19, Critical 36) — this also matches the class imbalance already present in the full 314-row survey (skewed toward Critical/High), which is a genuine property of the survey population, not a pipeline artifact.
- **These new external-holdout numbers are still not fully trustworthy for several independent reasons that this task did not resolve**: (1) the external holdout has only 63 rows, with as few as 1 example of the "Low" class — per-class precision/recall for Low and Moderate on the external holdout are computed on 1 and 7 examples respectively and are not statistically meaningful; (2) 8/44 features remain imputed (median-filled from the mostly non-Sri-Lankan training distribution) for every Sri Lankan row, including the model's #8 globally-important feature (`wfhEnvironmentQuality`); (3) the supervised target (`riskLevel`) for Sri Lankan rows is still derived from a locally-constructed 6-item `exhaustion_composite` proxy rather than the same `burnout_score`-based `harmonized_risk_norm` construction used for the other four sources — the quantile thresholds themselves are fit only on non-Sri-Lankan sources (by design, to avoid leaking the holdout into label construction), but this means the Sri Lankan target and the training target are not measuring burnout on a verified-equivalent scale; (4) roughly 76% of all predictor values in the full training dataset remain synthetic (per `generate_dataset.py`'s own printed coverage report), which is unchanged by this task and continues to affect the non-Sri-Lankan-dominated internal metrics and the global SHAP ranking.
