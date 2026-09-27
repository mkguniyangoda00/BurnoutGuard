# Thesis Numbers Reference Sheet

Verbatim numbers extracted from source files. No interpretation. Every number
cites its source file.

---

## 1. Dataset numbers

**Source: DATA_QUALITY_NOTES.md, build_target.py run output, build_features.py run output**

- Raw source file: `raw_datasets/sri_lankan_developer_burnout.csv`
- Raw row count: **314**
- Raw column count: **47** (46 substantive columns + Timestamp)
- Row count after duplicate removal: **311**
- Rows dropped: **3** (0-indexed positions 76, 130, 245 — second-submitted of each exact-duplicate pair)

**Class distribution, n=314 (self-referenced quantile thresholds, before dedup)**
Source: build_target.py run output

| Class | Count | % |
|---|---:|---:|
| Low | 83 | 26.4% |
| Moderate | 105 | 33.4% |
| High | 62 | 19.7% |
| Critical | 64 | 20.4% |

Self-referenced quantile thresholds (fit on these 314 rows only): q25 = 2.6666666666666665, q50 = 3.3333333333333335, q75 = 3.6666666666666665

**Class distribution, n=311 (post-dedup, used for modeling)**
Source: evaluate_model.py run output

| Class | Count | % |
|---|---:|---:|
| Low | 83 | 26.7% |
| Moderate | 103 | 33.1% |
| High | 61 | 19.6% |
| Critical | 64 | 20.6% |

**Feature count:** 40 features + risk_level target (41 columns total in `sri_lankan_model_ready.csv`)
Source: build_features.py run output, results_baselines.json (`"nFeatures": 40`)

**Missingness:**
- Raw 47 columns: 0 missing values in any column (Step 1 inspection)
- After encoding (build_features.py): 0 missing values introduced by encoding
Source: build_features.py run output ("Missingness check: 0 missing values introduced by encoding")

**Fold-level class support (post-dedup, n=311, 15 CV folds)**
Source: session run output (per-fold class count check)

| Class | min | mean | max (per fold, n≈62) |
|---|---:|---:|---:|
| Low | 16 | 16.60 | 17 |
| Moderate | 20 | 20.60 | 21 |
| High | 12 | 12.20 | 13 |
| Critical | 12 | 12.80 | 13 |

---

## 2. Data quality / authenticity findings

**Source: DATA_QUALITY_NOTES.md**

**Exact duplicates:**
- Fully identical across all 47 raw columns (incl. Timestamp): **0**
- Identical across all 46 non-Timestamp columns: **6 rows (3 pairs)**

| Row indices (0-indexed) | Timestamps | Gap |
|---|---|---|
| 75, 76 | 2026-09-07 11:13:41 / 11:14:02 | 21s |
| 129, 130 | 2026-09-07 11:25:06 / 11:25:25 | 19s |
| 244, 245 | 2026-09-07 11:50:01 / 11:50:02 | 1s |

**Near-duplicate check:** same 6 rows as above; no additional group.

**Formula-generation check (rules out fabrication):**
- Regressing each of the 7-feature "objective" cluster on the other 6: R² between **0.5353 and 0.6950** (not ~1.0, i.e. not a deterministic formula)
- `exhaustion_composite` regressed on the 7-feature cluster: **R² = 0.4747**
- Individual exhaustion items regressed on the 7-feature cluster: **R² between 0.1280 and 0.2150**

**Correlated "objective" feature cluster** (7 features: working_hours_per_day, overtime_hours_per_week, urgent_tasks_per_week, breaks_per_workday, exercise_days_per_week, caffeinated_drinks_per_day, commute_time_minutes) — pairwise correlated at **|r| = 0.6–0.74** (from prior session correlation check, cited in results_shap_stability.json collinearity caveat and DATA_QUALITY_NOTES.md context).

**Conclusion (DATA_QUALITY_NOTES.md):** consistent with real survey data collected in a single administered session, not fabricated/synthetically generated. Caveat: elevated risk of satisficing/reduced response independence given the rapid, batch administration pattern.

**Adjustment made:** dropped rows 76, 130, 245 (second-submitted of each duplicate pair) → 311 rows retained for modeling.

---

## 3. Negative result numbers (prior pooled-dataset / global-to-local approach)

**Source: NEGATIVE_RESULT.md** (archived at `experiments/global_to_local_generalization/`, untouched in this pipeline)

**Top-line comparison:**

| | Existing mixed-population (63-row holdout) | Zero-shot four-class (314-row eval) | Zero-shot binary (314-row eval) |
|---|---|---|---|
| Development rows | 251 Sri Lankan + non-Sri-Lankan | 0 Sri Lankan (256,800 non-Sri-Lankan only) | 0 Sri Lankan (256,800 non-Sri-Lankan only) |
| Evaluation rows | 63 | 314 | 314 |
| Selected model | LightGBM (v2.22) | XGBoost | XGBoost |
| Dev/CV macro F1 | 0.696 (repeated-CV mean) | 0.6746030510043313 (dev-set) | 0.86898000911063 (dev-set) |
| **Eval macro F1** | **0.3046** | **0.28609923011120614** | **0.5447883277694282** |
| Eval weighted F1 | 0.4679 | 0.4590760740079936 | 0.7086711781639309 |
| Eval macro ROC-AUC | 0.7501 | 0.6574908857281978 | 0.7232198695613329 |
| Eval accuracy | 0.4286 | 0.4299363057324841 | 0.6528662420382165 |

**Sri Lankan evaluation class distribution under borrowed (non-Sri-Lankan) quantile thresholds (n=314):**

| Class | Count | % |
|---|---:|---:|
| Low | 6 | 1.9% |
| Moderate | 35 | 11.1% |
| High | 93 | 29.6% |
| Critical | 180 | **57.3%** |

**Comparison: same 314 rows, quantile-binned within Sri Lankan subset itself (read-only audit calc):**

| Class | Count | % |
|---|---:|---:|
| Low | 83 | 26.4% |
| Moderate | 105 | 33.4% |
| High | 62 | 19.7% |
| Critical | 64 | 20.4% |

**Diagnosis (NEGATIVE_RESULT.md Section 4):**
- Different raw field: non-Sri-Lankan labels from native `burnout_score`; Sri Lankan label from `exhaustion_composite` (6-item Likert mean)
- Different population anchoring: min-max normalization anchored to each population's own range (non-Sri-Lankan: ~100k+ rows; Sri Lankan: 314 rows)
- Borrowed quantile thresholds: q25≈0.0704225352112676, q50≈0.2535211267605634, q75≈0.49, fit exclusively on pooled non-Sri-Lankan reference, applied unchanged to Sri Lankan values
- Leakage ruled out: zero-shot split (0 Sri Lankan rows in development) did not improve eval macro F1 over the mixed-population 251/63 split (0.2861 vs 0.3046) — rules out training leakage as the dominant cause
- Tiny-class problem reproduced, not fixed, at 314 rows: Low-class support only rose from 1 (at n=63) to 6 (at n=314); Low-class F1 0.1038961038961039 (n=314) vs 0.118 (n=63)

**Decision:** pivoted to Sri Lankan-only model with self-referenced target construction (this pipeline).

---

## 4. Baseline numbers

**Source: results_baselines.json** (n=311, RepeatedStratifiedKFold n_splits=5, n_repeats=3, random_state=42, 15 folds)

| Model | Accuracy (mean ± std) | Macro F1 (mean ± std) | Weighted F1 (mean ± std) |
|---|---|---|---|
| DummyMostFrequent | 0.3311827956989247 ± 0.0072928279388443686 | 0.12438289744343228 ± 0.0020602069923585375 | 0.16483400162412037 ± 0.006344880274609617 |
| DummyStratified | 0.2475337088240313 ± 0.026904202542354563 | 0.23389548574000824 ± 0.0293575127557276 | 0.24792322669096317 ± 0.028262580865296764 |

**Per-class F1 (mean ± std across 15 folds):**

| Class | DummyMostFrequent | DummyStratified |
|---|---|---|
| Low | 0.0 ± 0.0 | 0.21782531194295895 ± 0.06621233655996685 |
| Moderate | 0.49753158977372913 ± 0.00824082796943415 | 0.345954316686024 ± 0.0695674124849442 |
| High | 0.0 ± 0.0 | 0.2002886002886003 ± 0.08741969042633876 |
| Critical | 0.0 ± 0.0 | 0.17151371404244967 ± 0.05727524558588856 |

---

## 5. Candidate model numbers

**Source: results_candidates.json** (n=311, 40 features; Outer CV: RepeatedStratifiedKFold n_splits=5, n_repeats=3, random_state=42; Inner: GridSearchCV cv=3, scoring=f1_macro, nested per outer fold)

| Model | Accuracy (mean ± std) | Macro F1 (mean ± std) | Weighted F1 (mean ± std) |
|---|---|---|---|
| LogisticRegression | 0.5167093360641748 ± 0.05717685000478952 | 0.4644834457716545 ± 0.05620061470865611 | 0.48127864402062603 ± 0.05727176353859594 |
| RandomForest_shallow | 0.5435057176992661 ± 0.05516421168429601 | 0.4627708835932766 ± 0.042859578915782855 | 0.4863876188465379 ± 0.04956436760683469 |

**Per-class F1 (mean ± std across 15 folds):**

| Class | LogisticRegression | RandomForest_shallow |
|---|---|---|
| Low | 0.593675522688659 ± 0.09735934400777743 | 0.6450178592061644 ± 0.10229728465611684 |
| Moderate | 0.5067422093601583 ± 0.05931783021782634 | 0.5256845686191688 ± 0.08326578066291802 |
| High | 0.09154135338345865 ± 0.11383478925168088 | 0.0 ± 0.0 |
| Critical | 0.6659746976543417 ± 0.046355679488248265 | 0.6803811065477733 ± 0.040497809805815875 |

**Hyperparameters selected per fold (LogisticRegression, C):** 0.1, 0.01, 0.01, 0.01, 0.01, 0.01, 0.1, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01 — modal value **C=0.01** (13/15 folds)

**Hyperparameters selected per fold (RandomForest_shallow, max_depth / min_samples_leaf):**
(2,5), (4,15), (3,5), (3,10), (4,10), (4,5), (4,10), (4,5), (2,5), (3,15), (4,5), (4,10), (3,15), (4,5), (2,15)

**Model selected for Stage C/D: LogisticRegression** (retains partial signal on High: F1 0.0915 vs RandomForest's total collapse; more balanced confusion pattern)

---

## 6. Confusion matrix for the selected model (LogisticRegression)

**Source: results_candidates.json → confusionMatrices** (aggregated across all 15 CV outer folds, out-of-fold predictions pooled; rows=true, cols=predicted; label order [Low, Moderate, High, Critical])

| True \ Pred | Low | Moderate | High | Critical |
|---|---:|---:|---:|---:|
| Low | 149 | 88 | 9 | 3 |
| Moderate | 73 | 179 | 20 | 37 |
| High | 24 | 97 | 13 | 49 |
| Critical | 5 | 34 | 12 | 141 |

**True-High rows (n=183) predicted as:**

| Predicted | Count | % |
|---|---:|---:|
| Low | 24 | 13.1% |
| Moderate | 97 | 53.0% |
| High | 13 | 7.1% |
| Critical | 49 | 26.8% |

**For reference — RandomForest_shallow confusion matrix (not selected):**

| True \ Pred | Low | Moderate | High | Critical |
|---|---:|---:|---:|---:|
| Low | 164 | 82 | 0 | 3 |
| Moderate | 76 | 193 | 1 | 39 |
| High | 15 | 111 | 0 | 57 |
| Critical | 3 | 39 | 0 | 150 |

True-High (n=183) predicted as: Low 15 (8.2%), Moderate 111 (60.7%), High 0 (0.0%), Critical 57 (31.1%)

**Notes (verbatim from results_candidates.json):**
- highClassCollapse: "Both candidates struggle on the High class (fold-level test support 12/fold, one of the two thinnest classes). LogisticRegression retains partial signal (per-class F1 0.0915, some folds recover True-High correctly). RandomForest_shallow collapses entirely on High (F1 0.0000 in all 15 folds, 0 correct predictions in the aggregated confusion matrix)."
- misclassificationDirection: "For both models, misclassified True-High rows skew toward Moderate (under-alert) over Critical (over-alert), roughly 2:1: LogisticRegression 53.0% Moderate vs 26.8% Critical (13.1% Low, 7.1% correct); RandomForest_shallow 60.7% Moderate vs 31.1% Critical (8.2% Low, 0.0% correct). This is the less-safe failure direction for a risk-screening tool, since it means true-High-risk individuals are more often shown as Moderate than as Critical."
- ordinalStructureLimitation: "risk_level is inherently ordinal (Low < Moderate < High < Critical), and both models were trained as plain (unordered) multiclass classifiers, which treats every misclassification pair as equally costly. High sitting between the two classes it is most confused with (Moderate and Critical) is consistent with genuine ordinal proximity rather than a modeling artifact specific to one algorithm. Flagged as a limitation and future direction for the writeup: consider an ordinal classification formulation (e.g. proportional-odds / ordinal logistic regression) or cost-sensitive misclassification weighting that penalizes a Low<->Critical error more heavily than a High<->Critical or High<->Moderate error. Not implemented in this evaluation given time constraints and n=311; noted here for follow-up."

---

## 7. Bootstrap CI numbers

**Source: results_bootstrap_ci.json** (model: LogisticRegression; n=311 rows; 933 pooled out-of-fold observations = 311 × 3 CV repeats; 1000 bootstrap resamples; percentile CI 2.5%/97.5%)

**Point estimates (pooled out-of-fold predictions):**

| Metric | Value |
|---|---:|
| Accuracy | 0.5166130760986066 |
| Macro F1 | 0.4700790022635869 |

**Point estimates, per-class F1 with support (out of 933 pooled observations):**

| Class | F1 | Support |
|---|---:|---:|
| Low | 0.596 | 249 |
| Moderate | 0.5063649222065064 | 309 |
| High | 0.10970464135021098 | 183 |
| Critical | 0.6682464454976303 | 192 |

**Bootstrap 95% CIs:**

| Metric | Mean | Std | 2.5% | 97.5% |
|---|---:|---:|---:|---:|
| Accuracy | 0.5158638799571276 | 0.01626826054710183 | 0.4844587352625938 | 0.547722400857449 |
| Macro F1 | 0.4688288029924998 | 0.014435418012390906 | 0.4422033931513691 | 0.49671904594098015 |
| Low F1 | 0.5948478329482412 | 0.025679328584309435 | 0.5407365805168987 | 0.6435323231198572 |
| Moderate F1 | 0.5058557439637353 | 0.02260715869849169 | 0.46223531386371264 | 0.5491803278688525 |
| High F1 | 0.1087636147493051 | 0.027727982811880235 | 0.06111560758921849 | 0.17022573949143746 |
| Critical F1 | 0.6658480203087174 | 0.027329496092851412 | 0.6111077963404933 | 0.7191284616856666 |

**Per-class support across the 1000 bootstrap resamples:**

| Class | Mean | Min | Max |
|---|---:|---:|---:|
| Low | 249.458 | 212 | 297 |
| Moderate | 309.259 | 267 | 365 |
| High | 183.127 | 147 | 219 |
| Critical | 191.156 | 152 | 236 |

**High-class zero-F1 fraction:**
- Fraction of 1000 resamples with High F1 exactly 0.0: **0.0** (0/1000)

**CI-methodology limitation (verbatim from results_bootstrap_ci.json):**
"The 933 pooled out-of-fold pairs come from only 311 unique people, each appearing 3 times (once per CV repeat, under a different fold partition and, in general, a different fitted model). A single bootstrap resample can therefore draw multiple, correlated predictions for the same person across different repeats, rather than 933 independent observations. Standard bootstrap CIs assume i.i.d. resampling units; here the true number of independent units is 311, not 933. This is a CI-methodology limitation, not a modeling defect: it means the reported CIs (accuracy, macro F1, per-class F1) likely somewhat understate the true sampling uncertainty relative to an ideal bootstrap over independent people. The point estimates and relative comparisons (e.g. the High-class zero-F1 fraction) are unaffected by this; only the CI widths should be read as a lower bound on true uncertainty, not an exact figure."

---

## 8. SHAP stability numbers

**Source: results_shap_stability.json** (model: LogisticRegression, C fixed at 0.01 [modal value from Stage B nested grid search]; seeds 42/43/44; bootstrap resample of 311-row training data per seed; SHAP computed on a fixed 100-row evaluation sample, seed=123)

**Top-10 per seed (feature, mean|SHAP|):**

*Seed 42:*
1. concentration_difficulty — 0.020903441437351587
2. sleep_quality — 0.017732988022324914
3. exercise_days_per_week — 0.014837615724376729 [objective cluster]
4. job_satisfaction — 0.014728180688927235
5. caffeinated_drinks_per_day — 0.01426873144948239 [objective cluster]
6. years_of_experience — 0.014230090539012627
7. breaks_per_workday — 0.014000004670074158 [objective cluster]
8. urgent_tasks_per_week — 0.013513105857503404 [objective cluster]
9. role_clarity_rating — 0.01342269615255422
10. work_autonomy_rating — 0.013018597661060166

*Seed 43:*
1. energy_level — 0.016655264737402354
2. concentration_difficulty — 0.016465908420811103
3. breaks_per_workday — 0.016053077204583707 [objective cluster]
4. after_hours_contact_frequency — 0.014557189200729861
5. working_hours_per_day — 0.014421511660035575 [objective cluster]
6. job_satisfaction — 0.01418484786818315
7. sleep_quality — 0.013816117157970133
8. commute_time_minutes — 0.013744954271489664 [objective cluster]
9. context_switching_frequency — 0.012701798880918215
10. pay_fairness_rating — 0.012475645065052388

*Seed 44:*
1. concentration_difficulty — 0.019215257155827642
2. exercise_days_per_week — 0.018792944498850887 [objective cluster]
3. work_challenge_confidence — 0.017679111924578286
4. energy_level — 0.016590477190422014
5. pressure_coping_rating — 0.015619792347863115
6. pay_fairness_rating — 0.01544291038290716
7. breaks_per_workday — 0.014088000040678674 [objective cluster]
8. meal_quality_rating — 0.013780522725052752
9. commute_time_minutes — 0.013491605413967645 [objective cluster]
10. sleep_quality — 0.013209517566292467

**Consistency across the 3 seeds' top-10:**

- Appeared in all 3 seeds (3 features): breaks_per_workday [objective cluster], concentration_difficulty, sleep_quality
- Appeared in exactly 2/3 seeds (5 features): commute_time_minutes [objective cluster], energy_level, exercise_days_per_week [objective cluster], job_satisfaction, pay_fairness_rating
- Appeared in exactly 1/3 seeds (11 features): after_hours_contact_frequency, caffeinated_drinks_per_day [objective cluster], context_switching_frequency, meal_quality_rating, pressure_coping_rating, role_clarity_rating, urgent_tasks_per_week [objective cluster], work_autonomy_rating, work_challenge_confidence, working_hours_per_day [objective cluster], years_of_experience

**Objective-cluster (7 features: working_hours_per_day, overtime_hours_per_week, urgent_tasks_per_week, breaks_per_workday, exercise_days_per_week, caffeinated_drinks_per_day, commute_time_minutes) collinearity flag:**

- Appearing in ANY seed's top-10: **6/7** → breaks_per_workday, caffeinated_drinks_per_day, commute_time_minutes, exercise_days_per_week, urgent_tasks_per_week, working_hours_per_day
- Consistent across all 3 seeds: **1/7** → breaks_per_workday
- Never appears in any seed's top-10: overtime_hours_per_week

**Collinearity caveat (verbatim from results_shap_stability.json):**
"6 of the 7 known-collinear 'objective' features (pairwise |r|=0.6-0.74, see earlier correlation check) appear in at least one seed's top-10 SHAP ranking: ['breaks_per_workday', 'caffeinated_drinks_per_day', 'commute_time_minutes', 'exercise_days_per_week', 'urgent_tasks_per_week', 'working_hours_per_day']. 1 of them are consistent across all 3 seeds: ['breaks_per_workday']. Because these features are highly intercorrelated, SHAP can arbitrarily split or shift credit among them depending on which exact bootstrap resample and feature ordering the explainer encounters -- a feature's presence, absence, or rank within this cluster should not be read as evidence that it specifically (rather than the correlated cluster as a whole) drives predictions. Interpret this cluster's SHAP contribution collectively, not feature-by-feature."

---

## 9. Pooled/harmonized dataset numbers (initial approach)

**Source: `experiments/global_to_local_generalization/target_audit_generation.log`, `dataset_target_construction_metadata.json`, `AUDIT_REPORT.md`** (all archived, read-only for this verification — not modified)

**Synthetic predictor percentage — confirmed exact wording (target_audit_generation.log, "[5/6] Preparing predictor features" section):**

```
[5/6] Preparing predictor features...
      Total predictor features: 44

      WARNING: 100% synthetically generated features:
        - isWeekendWork (15% base probability)
        - isOnCallToday (10% base probability)
      These features have NO real ground truth and should be used cautiously in interpretation.

      Predictor feature coverage:
        Total values: 11,313,016
        Real values: 2,659,213 (23.5%)
        Synthetic values: 9,159,553 (81.0%)
      -> Model trained on 81.0% synthetic predictor data
```

Restated in the same log's summary section:
```
PREDICTOR DATA QUALITY:
  - 81.0% synthetic values in predictors
  - Synthetic filling: independent of target
  - 100% synthetic features: isWeekendWork, isOnCallToday (flagged)
```

Confirmed: **81.0% synthetic / 23.5% real** is the exact figure and wording, matching recollection. Total predictor values: 11,313,016 (Real: 2,659,213; Synthetic: 9,159,553).

**Discrepancy to flag, not resolved here:** `dataset_target_construction_metadata.json` reports a different aggregate figure for the same quantity: `"pct_synthetic_predictors": 76.4` (i.e. 76.4% synthetic, vs. the log's 81.0%). Both are verbatim from their respective source files; this reference sheet does not reconcile them — cite whichever source is used, and note the other gives a different number for nominally the same statistic if both are referenced.

**Additional discrepancy:** the log's "[5/6]" section and summary both state `isWeekendWork` and `isOnCallToday` are "100% synthetically generated features." `dataset_target_construction_metadata.json`'s `predictor_feature_coverage` instead lists both features with `"n_real": 314, "n_synthetic": 256800, "pct_real": 0.1"` — i.e. 0.1% real, not 0.0%/100% synthetic. Both figures are quoted verbatim from their respective files; not reconciled here.

**Dataset row/source numbers (target_audit_generation.log, dataset_target_construction_metadata.json):**

- Rows loaded from `harmonized_base.csv`: **257,114**
- Rows in final `dataset.csv`: **257,114**
- Total predictor features: **44**
- Target column: `riskLevel`; canonical continuous target: `harmonized_risk_norm`
- Quantile thresholds (log, matches metadata): q0=0.0000, q25=0.0704, q50=0.2535, q75=0.4900, q100=1.0000
- Target class distribution in `dataset.csv` (log's [VALIDATION] section, n=257,114):

| Class | Count | % |
|---|---:|---:|
| Low | 67,147 | 26.1% |
| Moderate | 63,649 | 24.8% |
| Critical | 63,544 | 24.7% |
| High | 62,774 | 24.4% |

  (Note: `dataset_target_construction_metadata.json`'s `target_integrity_validation.class_distribution` gives slightly different counts for the same classes — Low 67,145 / Moderate 63,637 / Critical 63,570 / High 62,762 — again not reconciled here, both cited verbatim from their sources.)

**Source datasets pooled (`dataset_target_construction_metadata.json`):**
- `sources_with_burnout_measurement` (4 external sources, each contributing a native `burnout_score`): mental_health_burnout_tech_2026, tech_mental_health_burnout, indian_developer_burnout_2026, work_from_home_burnout_dataset
- `sources_without_burnout_measurement`: sri_lankan_developer_burnout (314 rows; the raw Sri Lankan survey has no `burnout_score` field — log: "Sri Lankan survey responses: 314 rows, 18 columns" and "NOTE: Sri Lankan data has no single burnout_score column")

**100%-synthetic (per the log's own flagging) features: 2** — `isWeekendWork`, `isOnCallToday` (see discrepancy note above re: metadata's 0.1%-real figure for the same two features).

**Individual predictor-feature synthetic/real coverage (`dataset_target_construction_metadata.json` → `predictor_feature_coverage`, all 44 features, `pct_real` verbatim):**

| Feature | n_real | n_synthetic | pct_real |
|---|---:|---:|---:|
| sleepHours | 257,114 | 0 | 100.0% |
| workHours | 257,114 | 0 | 100.0% |
| exerciseLevel | 255,314 | 1,800 | 99.3% |
| stressLevel | 255,314 | 1,800 | 99.3% |
| workSatisfaction | 255,314 | 1,800 | 99.3% |
| anxietyLevel | 255,314 | 1,800 | 99.3% |
| socialSupportLevel | 250,314 | 6,800 | 97.4% |
| caffeineIntake | 155,189 | 101,925 | 60.4% |
| screenTimeHours | 152,114 | 105,000 | 59.2% |
| overtimeHours | 150,314 | 106,800 | 58.5% |
| selfEfficacy | 105,314 | 151,800 | 41.0% |
| workloadRating | 100,314 | 156,800 | 39.0% |
| wfhEnvironmentQuality | 100,314 | 156,800 | 39.0% |
| workModeEncoded | 100,314 | 156,800 | 39.0% |
| afterHoursMessaging | 7,114 | 250,000 | 2.8% |
| breaksTaken | 2,114 | 255,000 | 0.8% |
| moodScore | 256,800 | 256,800 | 0.0% (sri_lankan_unavailable: 314) |
| lonelinessLevel | 256,800 | 256,800 | 0.0% (sri_lankan_unavailable: 314) |
| familyResponsibilityLoad | 256,800 | 256,800 | 0.0% (sri_lankan_unavailable: 314) |
| meetingsCount | 256,800 | 256,800 | 0.0% (sri_lankan_unavailable: 314) |
| deadlineFrequency | 256,800 | 256,800 | 0.0% (sri_lankan_unavailable: 314) |
| bugFixingLoad | 256,800 | 256,800 | 0.0% (sri_lankan_unavailable: 314) |
| interruptionsPerDay | 256,800 | 256,800 | 0.0% (sri_lankan_unavailable: 314) |
| sleepQuality | 314 | 256,800 | 0.1% |
| commuteMinutes | 314 | 256,800 | 0.1% |
| energyLevel | 314 | 256,800 | 0.1% |
| mealQuality | 314 | 256,800 | 0.1% |
| emotionalFatigue | 314 | 256,800 | 0.1% |
| motivationLevel | 314 | 256,800 | 0.1% |
| concentrationIssues | 314 | 256,800 | 0.1% |
| irritabilityLevel | 314 | 256,800 | 0.1% |
| copingAbility | 314 | 256,800 | 0.1% |
| powerInternetDisruption | 314 | 256,800 | 0.1% |
| salaryWorkloadSatisfaction | 314 | 256,800 | 0.1% |
| urgentTasksCount | 314 | 256,800 | 0.1% |
| sprintPressureRating | 314 | 256,800 | 0.1% |
| isWeekendWork | 314 | 256,800 | 0.1% |
| contextSwitchingFrequency | 314 | 256,800 | 0.1% |
| isOnCallToday | 314 | 256,800 | 0.1% |
| managerSupportLevel | 314 | 256,800 | 0.1% |
| peerSupportLevel | 314 | 256,800 | 0.1% |
| autonomyLevel | 314 | 256,800 | 0.1% |
| roleAmbiguity | 314 | 256,800 | 0.1% |
| taskComplexity | 314 | 256,800 | 0.1% |

**Target leakage check (log's [VALIDATION] section, verbatim):**
"No target-construction columns found in feature matrix" / "Target validation passed" — logged as "TARGET LEAKAGE: NONE DETECTED" with basis: "No predictor variables used in target construction", "harmonized_risk_norm removed from feature matrix X", "Validated with get_target_leakage_columns() and validate_target_leakage()".

**AUDIT_REPORT.md corroboration:** independently states the same critical finding in prose (not a new number): "Model trained on 256K rows, but ~30-50% of many predictor columns are synthetic random values" and flags `isWeekendWork`/`isOnCallToday` as "100% synthetically generated" predictors with "Hard-coded probability (15% weekend, 10% on-call) is not based on any data" — consistent with the log's per-feature table above, though AUDIT_REPORT.md's own "~30-50%" range prose estimate is looser than the log's precise 81.0%/23.5% aggregate figure (a third, distinct figure from the same underlying data — also not reconciled here).
