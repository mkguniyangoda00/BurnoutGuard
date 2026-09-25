# Negative Result: Global-to-Local Generalization via Pooled External Datasets

**Status:** Archived. This approach was abandoned in favor of a Sri Lankan-only
model trained and evaluated on real, directly-observed data.

This document consolidates three prior reports — `AUDIT_REPORT.md`,
`target_construction_audit.md`, and `zero_shot_evaluation_report.md` (all in
this folder) — into a single narrative. Every number below is quoted verbatim
from those reports or their underlying JSON artifacts; nothing here is
estimated or rounded beyond what the source already reported.

---

## 1. Hypothesis

The approach pooled four external burnout datasets (256,800 rows total —
global tech/WFH workers, one South Asian proxy from an Indian developer
survey) and harmonized them into a common schema alongside a small,
genuinely local Sri Lankan developer survey (314 rows). The expectation was
that a model trained on the large pooled external corpus could transfer
cross-population to Sri Lankan developers, compensating for the local
sample's small size — i.e., that "global-to-local generalization" could
substitute for a population-native training set. A strict zero-shot
evaluation (0 Sri Lankan rows in training/development, all 314 reserved for
evaluation) was designed specifically to test this transfer claim without
any contamination from Sri Lankan data into model fitting.

*Source: `zero_shot_evaluation_report.md`, "What this experiment changes vs.
the existing pipeline."*

## 2. Method

**Harmonization schema.** Each of the four external sources was mapped into
a common BurnoutGuard schema by `harmonize_datasets.py`. Each source's own
native `burnout_score` column was min-max normalized to `[0,1]`
**within that source's own rows** via `minmax_norm()`
(`harmonize_datasets.py:82-91`), before the four sources were concatenated.

*Source: `target_construction_audit.md`, Section 1.*

**Target construction.** The four-class categorical label (`Low` / `Moderate`
/ `High` / `Critical`) was produced by `create_risk_labels()` in
`generate_dataset.py:122-206`. Quantile edges for 4 equiprobable classes were
fit via `pd.qcut()` using only non-Sri-Lankan rows as the reference
(`threshold_reference`, `generate_dataset.py:379-382`), yielding thresholds
`q25=0.0704225352112676`, `q50=0.2535211267605634`, `q75=0.49`. These edges
were then applied via a single shared `pd.cut()` call across the **combined**
corpus (all 5 sources, 257,114 rows) at once.

*Source: `target_construction_audit.md`, Section 1; corroborated by
`dataset_target_construction_metadata.json` (`quantile_thresholds`,
`quantile_threshold_fit_source: "non-Sri Lankan development sources only"`).*

For the Sri Lankan survey specifically, `harmonize_sri_lankan_survey()`
(`harmonize_datasets.py:330-337`) built its raw field differently: a 6-item
Likert exhaustion composite (`exhaustion_composite`, the row-wise mean of six
items — "How often do you feel tired?", "...physically exhausted?",
"...emotionally exhausted?", "...I can't take it anymore?", "...feel worn
out?", "...weak and susceptible to illness?") — because the Sri Lankan survey
has no native `burnout_score` field at all. This composite was then min-max
normalized, but **anchored to the 314-row Sri Lankan subset's own min/max**
rather than the pooled external range, before the same shared quantile
thresholds were applied to it.

*Source: `target_construction_audit.md`, Section 2.*

**Zero-shot split design.** `train.py`'s existing pipeline (`train_zero_shot.py`'s
baseline for comparison) used an 80/20 split of the 314 Sri Lankan rows: 251
folded into development alongside the external sources, 63 held out for
evaluation. This experiment's `create_sri_lankan_zero_shot_split()` instead
put **0** Sri Lankan rows into development and **all 314** into evaluation.
This design was chosen specifically to close a skeptical reader's objection
to the 251/63 split — that the 251-row development share did not fully
guarantee Sri Lankan data had zero influence on preprocessing, model
selection, or hyperparameter tuning. The zero-shot split removes that
possibility entirely: preprocessing (imputer/scaler) was fit only on the
256,800 non-Sri-Lankan development rows, model selection used 5×3 repeated
stratified CV on those same rows only, hyperparameter tuning (`GridSearchCV`)
used those rows only, and `X_eval`/`y_eval` (all 314 Sri Lankan rows) touched
the fitted model exactly once, after tuning completed — disjointness between
`X_eval.index` and `X_dev.index` was asserted in code before that call.

*Source: `zero_shot_evaluation_report.md`, Sections 1 and 3
(`dataTouchConfirmation` table).*

## 3. Results

All figures below are taken directly from `models/zero_shot/summary.json`,
`models/zero_shot/results_four_class.json`, and
`models/zero_shot/results_binary.json`.

**Top-line comparison** (`zero_shot_evaluation_report.md`, Section 1):

| | Existing mixed-population (63-row holdout) | Zero-shot four-class (314-row eval) | Zero-shot binary (314-row eval) |
|---|---|---|---|
| Development rows | 251 Sri Lankan + non-Sri-Lankan | 0 Sri Lankan (256,800 non-Sri-Lankan only) | 0 Sri Lankan (256,800 non-Sri-Lankan only) |
| Evaluation rows | 63 | 314 | 314 |
| Selected model | LightGBM (v2.22) | XGBoost | XGBoost |
| Dev/CV macro F1 | 0.696 (repeated-CV mean) | 0.6746030510043313 (dev-set), CV mean 0.6979 | 0.86898000911063 (dev-set), CV mean 0.8789 |
| **Eval macro F1** | **0.3046** | **0.28609923011120614** | **0.5447883277694282** |
| Eval weighted F1 | 0.4679 | 0.4590760740079936 | 0.7086711781639309 |
| Eval macro ROC-AUC (OvR) | 0.7501 | 0.6574908857281978 | 0.7232198695613329 |
| Eval accuracy | 0.4286 | 0.4299363057324841 | 0.6528662420382165 |

The dev/CV macro F1 for four-class development (~0.68–0.70) is consistent
with the "~0.68–0.70 on development data" reference point; the corresponding
eval macro F1 dropped to 0.286–0.305 across both the existing and zero-shot
splits — the large development-to-evaluation gap this archiving effort set
out to document.

**Four-class development-set metrics** (256,800 non-Sri-Lankan rows,
`results_four_class.json` → `developmentMetrics`):

- Accuracy: 0.6767679127725856
- Macro precision: 0.6746223950701706, macro recall: 0.6751136465088555,
  macro F1: 0.6746030510043313, weighted F1: 0.6758837552407843
- ROC-AUC: 0.8922595074395095

Per-class (development, n=256,800; support column from the same file):

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| Low | 0.7293662542245063 | 0.7778936236762537 | 0.7528487513063534 | 67,139 |
| Moderate | 0.538673188627331 | 0.5263670953743593 | 0.5324490461308459 | 63,602 |
| High | 0.5905859279235106 | 0.5766008712441558 | 0.5835096161609638 | 62,669 |
| Critical | 0.8398642095053346 | 0.8195929957406531 | 0.8296047904191617 | 63,390 |

**Four-class Sri Lankan zero-shot evaluation metrics** (n=314,
`results_four_class.json` → `sriLankanZeroShotEvaluationMetrics`):

- Accuracy: 0.4299363057324841
- Macro precision: 0.30879068738673177, macro recall: 0.407078853046595,
  macro F1: 0.28609923011120614, weighted F1: 0.4590760740079936
- ROC-AUC: 0.6574908857281978

Per-class (Sri Lankan zero-shot eval, n=314):

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| Low | 0.056338028169014086 | 0.6666666666666666 | 0.1038961038961039 | 6 |
| Moderate | 0.16666666666666666 | 0.2 | 0.18181818181818182 | 35 |
| High | 0.2978723404255319 | 0.15053763440860216 | 0.2 | 93 |
| Critical | 0.7142857142857143 | 0.6111111111111112 | 0.6586826347305389 | 180 |

**Evaluation class distribution** (n=314, `results_four_class.json` →
`evaluationClassDistribution`, matching `target_construction_audit.md`
Section 4):

| Class | Count | % |
|---|---:|---:|
| Low | 6 | 1.9% |
| Moderate | 35 | 11.1% |
| High | 93 | 29.6% |
| Critical | 180 | 57.3% |

**Binary re-labeling results** (`results_binary.json`; LowModerate vs.
HighCritical). Development (n=256,800): accuracy 0.8692056074766356, macro F1
0.86898000911063, ROC-AUC 0.9471347554677768. Sri Lankan zero-shot evaluation
(n=314): accuracy 0.6528662420382165, macro precision 0.5696735395189003,
macro recall 0.6449119985705352, macro F1 0.5447883277694282, weighted F1
0.7086711781639309, ROC-AUC 0.7232198695613329. Per-class eval: LowModerate
precision 0.21666666666666667 / recall 0.6341463414634146 / F1
0.32298136645962733 / support 41; HighCritical precision 0.9226804123711341
/ recall 0.6556776556776557 / F1 0.7665952890792291 / support 273.

**Comparison-only reference (not part of the pipeline):** if Sri Lankan's
`harmonized_risk_norm` were instead quantile-binned using edges fit within
the Sri Lankan subset itself, rather than the shared external thresholds, the
distribution shifts to Low 83 (26.4%), Moderate 105 (33.4%), High 62 (19.7%),
Critical 64 (20.4%) — computed read-only for the audit and never applied in
the pipeline.

*Source: `target_construction_audit.md`, Section 4.*

## 4. Diagnosis

**Leakage was ruled out, not confirmed, as the cause.** The zero-shot split
(0 Sri Lankan rows in development, all 314 in evaluation) was strictly
cleaner on training-data isolation than the existing 251/63 mixed-population
split — it removed any possibility that Sri Lankan rows influenced
preprocessing, model selection, or hyperparameter tuning. If leakage in the
251/63 split had been propping up its evaluation score, the stricter
zero-shot split should have performed worse. It did not improve — four-class
zero-shot eval macro F1 (0.28609923011120614) was marginally *worse* than the
mixed-population result (0.3046), and macro ROC-AUC dropped further
(0.6574908857281978 vs. 0.7501). Removing the 251 Sri Lankan development rows
did not help external generalization; this rules out training-data leakage
as the dominant explanation for the low external score.

*Source: `zero_shot_evaluation_report.md`, Sections 1 and 4.*

**Label-construction incompatibility was identified as the dominant cause.**
`target_construction_audit.md` traced the Sri Lankan evaluation label back to
a fundamentally different construction path than the training label:

- **Different raw field.** Non-Sri-Lankan labels derive from each source's
  own native `burnout_score`. The Sri Lankan label derives from
  `exhaustion_composite`, a locally-defined 6-item Likert mean — the Sri
  Lankan survey has no `burnout_score` field at all.
- **Different population anchoring.** Both are min-max normalized to
  `harmonized_risk_norm` via the same formula, but each is anchored to its
  own population's min/max — non-Sri-Lankan sources to their own (100k+ row)
  ranges, Sri Lankan to its own 314-row range. A Sri Lankan respondent's 0.9
  means "close to the most-exhausted person in this 314-person sample," not
  the same underlying quantity as a non-Sri-Lankan respondent's 0.9.
- **Borrowed quantile thresholds.** The shared cut points (`q25≈0.070`,
  `q50≈0.254`, `q75≈0.49`) were fit exclusively on the pooled non-Sri-Lankan
  reference — correctly leakage-free with respect to threshold *fitting* —
  but then applied unchanged to the Sri Lankan `harmonized_risk_norm` values,
  which are not on a comparable scale to what those thresholds were fit
  against.
- **Resulting degenerate distribution.** This combination produced a
  57.3%-Critical Sri Lankan class distribution (180/314) under the shared
  thresholds, which shifts to a roughly balanced 20.4%-Critical distribution
  when Sri Lankan is instead quantile-binned on its own terms (Section 3
  above) — demonstrating the 57.3% figure is substantially a construction
  artifact of the borrowed thresholds, not necessarily a real prevalence
  signal.

The zero-shot experiment reproduced this exact 57.3% figure (180/314) in its
own evaluation set, since it reused the same `riskLabel` column without
refitting anything — confirming the label-construction problem, not the
split design, as the explanation for why a stricter split did not improve the
score.

*Source: `target_construction_audit.md`, Sections 3-4; `zero_shot_evaluation_report.md`,
Section 4.*

Supporting evidence that this is a construction, not a sample-size, problem:
the tiny-class fragility was reproduced rather than fixed by moving from 63
to 314 evaluation rows — the Low class support only rose from 1 to 6 (1.9% of
314), with Low-class F1 remaining noisy (0.1038961038961039 at n=314 vs.
0.118 at n=63).

*Source: `zero_shot_evaluation_report.md`, Section 2.*

The `AUDIT_REPORT.md` independently flagged the same structural issue from a
different angle before the zero-shot experiment was run: Reviewer Concern #2
("Sri Lankan data not actually in pipeline") and the broader finding that
`train_and_evaluate.py`'s alternative evaluation path used a "different
target definition" (`exhaustion_composite`/`y_proxy`) than the main
pipeline's `harmonized_risk_norm`-derived labels — the same raw-field
mismatch later quantified precisely in `target_construction_audit.md`.

*Source: `AUDIT_REPORT.md`, "Reviewer Concern #2," "Reviewer Concern #10,"
and Section on `train_and_evaluate.py` target generation (Lines 437-459).*

## 5. Decision

The zero-shot experiment was designed to give cross-population transfer its
strongest possible test — a clean, leakage-free split with zero Sri Lankan
influence on training. It still produced eval macro F1 of 0.28609923011120614
(four-class) / 0.5447883277694282 (binary) against development-set macro F1
of 0.6746030510043313 / 0.86898000911063 — a gap that persisted regardless of
split strictness, and that traces to the Sri Lankan evaluation label being
built from a different raw field, anchored to a different population, than
the label the model was trained to predict. Pooling large external datasets
cannot compensate for this: no amount of external data volume fixes a target
variable that measures a different construct for the population being
evaluated. This evidence — leakage ruled out, label incompatibility
confirmed as the dominant cause — is what justified abandoning the
global-to-local generalization approach in favor of a population-native
Sri Lankan-only model, trained and evaluated on real, directly-observed data
with a single consistent label-construction procedure throughout.
