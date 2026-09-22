# Zero-Shot Cross-Population Evaluation Report

**Scope:** new experiment variant only. Does not modify or overwrite
`models/model_v2.22-lightgbm.pkl`, `models/metadata_v2.json`, or any other
existing results file. All new artifacts are under `models/zero_shot/` and
this report. Numbers below are taken directly from the JSON files the code
produced (`models/zero_shot/summary.json`, `results_four_class.json`,
`results_binary.json`) and the run log (`zero_shot_run.log`) — nothing is
estimated.

**Code:** `train_zero_shot.py`. **Run log:** `zero_shot_run.log` (clean exit,
`PYEXIT:0`).

## What this experiment changes vs. the existing pipeline

`train.py`'s `create_sri_lankan_holdout()` splits the 314 Sri Lankan rows
80/20 (251 into development alongside the four public sources, 63 held out
for external evaluation). This experiment's `create_sri_lankan_zero_shot_split()`
instead puts **0** Sri Lankan rows into development and **all 314** into
evaluation — a strict zero-shot cross-population transfer test: the model
never sees a single Sri Lankan row, of any kind, before being scored on all
of them.

## 1. Results comparison

| | Existing mixed-population (63-row holdout) | Zero-shot four-class (314-row eval) | Zero-shot binary (314-row eval) |
|---|---|---|---|
| Development rows | 251 Sri Lankan + non-Sri-Lankan | 0 Sri Lankan (256,800 non-Sri-Lankan only) | 0 Sri Lankan (256,800 non-Sri-Lankan only) |
| Evaluation rows | 63 | 314 | 314 |
| Selected model | LightGBM (v2.22) | XGBoost | XGBoost |
| Dev/CV macro F1 | 0.696 (repeated-CV mean) | 0.6746 (dev-set), CV mean 0.6979 | 0.8690 (dev-set), CV mean 0.8789 |
| **Eval macro F1** | **0.3046** | **0.2861** | **0.5448** |
| **Eval weighted F1** | **0.4679** | **0.4591** | **0.7087** |
| Eval macro ROC-AUC (OvR) | 0.7501 | 0.6575 | 0.7232 |
| Eval accuracy | 0.4286 | 0.4299 | 0.6529 |

**The four-class zero-shot result is not an improvement over the existing mixed-population result — it is very slightly worse** (macro F1 0.2861 vs 0.3046, weighted F1 0.4591 vs 0.4679, ROC-AUC 0.6575 vs 0.7501). Removing the 251 Sri-Lankan rows from development did not help external generalization to the rest of the Sri Lankan population; if anything it removed a source of population-specific signal the mixed-population model was benefiting from, even though those 251 rows carry the same label-construction caveat described in Section 4. This is reported as observed, without softening it — the "stricter" split is stricter in isolation discipline, not better in the metric a reviewer would look at first.

The binary re-labelling (Task 2) score is substantially higher (macro F1 0.5448) than either four-class number, but **this is expected and not directly comparable** — collapsing four classes into two mechanically raises chance-level and typical achievable F1 (a coin-flip binary macro F1 baseline is ~0.5 vs. ~0.25 for four balanced classes), and it also removes the specific Low-class fragility discussed below by folding it into a larger LowModerate bucket. It answers a different question ("can the model tell low-risk from high-risk Sri Lankan developers") rather than a stricter version of the same question.

## 2. Per-class support — does 314 rows fix the tiny-class problem? No.

Existing mixed-population evaluation (n=63):

| Class | Support |
|---|---:|
| Low | 1 |
| Moderate | 7 |
| High | 19 |
| Critical | 36 |

Zero-shot four-class evaluation (n=314, **all** Sri Lankan rows):

| Class | Support | % of 314 |
|---|---:|---:|
| Low | 6 | 1.9% |
| Moderate | 35 | 11.1% |
| High | 93 | 29.6% |
| Critical | 180 | **57.3%** |

Going from 63 to 314 rows raised the Low class from 1 to 6 examples — still a tiny class in absolute and relative terms (1.9% of the set). The Low-class metrics reflect this: precision 0.056, recall 0.667, F1 0.104 (compare to the 63-row holdout's precision 0.0625, recall 1.0, F1 0.118 — noisy in both directions, consistent with a class this small). **The tiny-class problem is reproduced, not fixed, at 314 rows.** The severe class imbalance (57.3% Critical, matching the audit's finding almost exactly) dominates the evaluation set regardless of split strategy, because it is a property of how the Sri Lankan label was constructed (Section 4), not of how many Sri Lankan rows are held out.

Zero-shot binary evaluation (n=314):

| Class | Support | % of 314 |
|---|---:|---:|
| LowModerate | 41 | 13.1% |
| HighCritical | 273 | 86.9% |

The binary re-labelling absorbs the Low class into a larger 41-row bucket, which is why its metrics look more stable (LowModerate F1 0.323, HighCritical F1 0.767) — but the underlying 86.9%/13.1% imbalance is, if anything, more extreme than the four-class breakdown's largest-class share (57.3%).

## 3. Data-touch confirmation

Directly from `dataTouchConfirmation` in both `results_four_class.json` and `results_binary.json`, and verified against the code path in `train_zero_shot.py`:

| Step | Data used | Confirmed by |
|---|---|---|
| Preprocessing fit (imputer/scaler) | Non-Sri-Lankan development rows only (`X_dev`, 256,800 rows) | `build_preprocessing_pipeline` inside `compare_models_cv`/`fit_best_model_with_candidates`; refit per CV fold, `X_eval` never passed in |
| Model selection (`compare_models_cv`, 5×3 repeated stratified CV) | `X_dev`/`y_dev` only | `run_variant()` calls `compare_models_cv(X_dev, y_dev, ...)`; log shows "Zero-shot development rows (non-Sri-Lankan only): 256800" printed before any CV runs |
| Hyperparameter tuning (`GridSearchCV`) | `X_dev`/`y_dev` only | `fit_best_model_with_candidates(X_dev, y_dev, ...)`; preprocessing refit inside each grid fold |
| Target/threshold fitting | Quantile thresholds fit on non-Sri-Lankan sources only, inside `generate_dataset.py` (upstream of this script; not refit here) | `dataTouchConfirmation.targetThresholdFitData`; this script reuses the existing `riskLabel` column unmodified |
| Sri Lankan rows in development | **0** | `dataTouchConfirmation.sriLankanRowsInDevelopment: 0`; asserted in code (`create_sri_lankan_zero_shot_split` disjointness assertions) |
| Sri Lankan rows in evaluation | **314 (100%)** | `dataTouchConfirmation.sriLankanRowsInEvaluation: 314` |
| First point `X_eval`/`y_eval` touches the fitted model | Once, after tuning is complete (`evaluate_generic(best_pipeline, X_eval, y_eval, ...)`) | Code comment + placement in `run_variant()`; disjointness between `X_eval.index` and `X_dev.index` is asserted before this call |

Isolation discipline is the same as the existing pipeline's, just with 0 instead of 251 Sri Lankan rows in development.

## 4. Label-harmonisation caveat (Task 3) — still applies, not resolved by this split

Re-checked `target_construction_audit.md` against the current codebase and dataset before running this experiment. **It is still accurate.** Confirmed specifically:

- The Sri Lankan `riskLabel` is derived from `exhaustion_composite` (a 6-item Likert mean, survey-specific), via `harmonize_sri_lankan_survey()` in `harmonize_datasets.py`. The four non-Sri-Lankan sources derive their label from each source's own native `burnout_score` column, via their own `harmonize_*()` functions. **These are different raw fields.**
- Both are min-max normalised to `harmonized_risk_norm`, but the Sri Lankan normalisation is anchored to the 314-row Sri Lankan subset's own min/max, while each other source is anchored to its own subset's min/max — "same formula, different population it's anchored to," per the audit.
- The quantile thresholds that turn `harmonized_risk_norm` into four risk bands are fit once, on the pooled non-Sri-Lankan rows only (correctly leakage-free), and then applied unchanged to the Sri Lankan `harmonized_risk_norm` values.
- The audit's own diagnostic — that Sri Lankan's class distribution is 57.3% Critical under the shared thresholds — is reproduced exactly in this experiment's 314-row evaluation set (180/314 = 57.3%, Section 2 above), since this script reuses the same `riskLabel` column without refitting anything.

**This matters for how the zero-shot result should be read.** The zero-shot split (Task 1) is strictly cleaner about *training-data* isolation — it removes any possibility that Sri Lankan rows influenced preprocessing, model selection, or tuning, which the 251/63 split's 251-row development share did not fully guarantee to a skeptical reader. But the zero-shot split does **not** touch, and cannot fix, the *label construction* problem: the 314-row evaluation target is still built from a different raw field, normalised against a different population, than whatever the model actually learned to predict on non-Sri-Lankan `burnout_score`-derived labels. A reviewer should not read "we made the split stricter" as "we made the label comparable" — those are separate issues, and only the first was addressed here. If anything, the fact that the four-class zero-shot macro F1 (0.2861) is not better than the mixed-population result (0.3046) despite the stricter split is consistent with the label-harmonisation problem being the dominant source of the low external score, not the training-data leakage the stricter split was designed to rule out.

## 5. Errors, warnings, and unexpected results — reported honestly

- **A real bug was found and fixed in `train_zero_shot.py` before these results could be produced.** The script's final hyperparameter-tuning step originally called `train.py`'s own `fit_best_model()`, which internally rebuilds candidates via `train.py`'s `get_model_candidates()` — hardcoded to `objective="multi:softprob"`/`num_class=4` (XGBoost) and `objective="multiclass"`/`num_class=4` (LightGBM) regardless of the actual target. For the four-class variant this is harmless (it matches what's needed), but for the Task 2 binary variant it silently rebuilt a 4-class-configured XGBoost model against a 2-class target, which crashed downstream with `ValueError: Classification metrics can't handle a mix of binary and multilabel-indicator targets` inside `classification_report`. This was confirmed by running the unmodified code first (see `zero_shot_run_crash2.log`, preserved for the record) — the traceback is real, not fabricated. The fix: use the script's own `fit_best_model_with_candidates()` (which already existed for exactly this reason, per its docstring) with the class-count-matched candidates for **both** variants, not just the CV-comparison step. Re-run after the fix completed cleanly (`PYEXIT:0`, no tracebacks) — see `zero_shot_run.log`.
- **CV-stage ROC-AUC for the binary variant reports as "n/a" for all four candidate models** (see the "Repeated stratified CV summary" table in `zero_shot_run.log` for the binary variant — every model's ROC-AUC column reads `n/a`). This is a known, unfixed limitation of reusing `train.py`'s `cross_validate_model()` unmodified, per the task's instruction to keep the same CV protocol: that function hardcodes `roc_auc_score(..., labels=list(range(len(RISK_LEVELS))))` — always 4 labels — so for binary `y` (2-column probability output) it raises `ValueError` on every fold, which is caught and recorded as `None`. **This only affects the CV-stage ROC-AUC comparison table, not the final reported evaluation-stage ROC-AUC** (0.7232 for binary, computed correctly in this script's own `evaluate_generic()`, which branches on `n_classes == 2` and uses `y_proba[:, 1]`). Flagging this rather than silently patching `train.py`, since the task specified reusing "the same 5-fold x 3-repeat stratified CV protocol already implemented."
- **30 `OptimizeWarning: Unknown solver options: iprint` warnings** appear in the log, all from `LogisticRegression`'s solver during CV/tuning. This is a pre-existing, benign sklearn/scipy solver-option mismatch unrelated to this experiment (it would appear for any `LogisticRegression` fit in this codebase) and does not affect correctness of the reported metrics.
- **The four-class zero-shot macro F1 (0.2861) is not an improvement over the existing mixed-population result (0.3046)** — it is marginally worse, and the macro-ROC-AUC is notably worse (0.6575 vs 0.7501). This is called out plainly in Section 1 rather than framed as a win; a "stricter" split does not necessarily mean "better observed performance," and here it did not.
- No other unexpected runtime errors occurred. `cv_results_four_class.json` and `cv_results_binary.json` contain the full 15-fold CV traces per model, consistent with the printed summaries.

## Artifacts

- `models/zero_shot/results_four_class.json`, `models/zero_shot/results_binary.json` — full metrics, confusion matrices, tuning results
- `models/zero_shot/cv_results_four_class.json`, `models/zero_shot/cv_results_binary.json` — full 15-fold CV traces
- `models/zero_shot/model_four_class_xgboost.pkl`, `models/zero_shot/scaler_four_class_xgboost.pkl`
- `models/zero_shot/model_binary_xgboost.pkl`, `models/zero_shot/scaler_binary_xgboost.pkl`
- `models/zero_shot/summary.json` — condensed top-level comparison
- `zero_shot_run.log` — clean run (`PYEXIT:0`)
- `zero_shot_run_crash2.log` — preserved log of the pre-fix crash, for transparency
