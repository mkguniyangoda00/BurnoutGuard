# Sri Lankan External Holdout — Dual Label-Convention Report

**Git commit:** `fb13cffe27e443737486391f204ba9a161322885` (branch `dev`, 2026-09-08T22:09:03+05:30)
**Generated:** 2026-09-09 (this task)
**Model evaluated:** `models/model_v2.22-lightgbm.pkl` + `models/scaler_v2.22-lightgbm.pkl`
(LightGBM `v2.22`, the model behind the previously reported macro F1
0.3046 / ROC-AUC 0.7501 external holdout numbers, recorded in
`models/metadata_v2.json`). **Not retrained** — this task loads the existing
fitted pipeline and re-scores it against two different label conventions
applied to the same 63-row holdout split and the same predictions.

**This report supersedes nothing.** `target_construction_audit.md` and
`target_construction_fix_results.md` remain the authoritative record of the
underlying finding and the reverted fix attempt; this file is an additional
reporting lens over the same model and the same predictions, produced per
`target_construction_audit.md`'s Recommendation #2.

## Why two label conventions are being reported

`target_construction_audit.md` found that the Sri Lankan holdout's
ground-truth `riskLevel` is constructed from a different raw field
(`exhaustion_composite`, a six-item survey average) than the four
non-Sri-Lankan training sources (native `burnout_score`), and that Sri
Lankan's value is min-max normalized against its own 314-row sample before
the shared, non-Sri-Lankan-fit quantile thresholds are applied to it.
Recommendation #1 proposed fixing this by anchoring Sri Lankan's
normalization to the pooled non-Sri-Lankan `harmonized_risk_norm` range
instead of its own sample range. That fix was attempted and found to be
non-implementable as specified: because every non-Sri-Lankan source already
independently min-max-normalizes its own `burnout_score` to exactly [0,1]
*before* pooling, the pooled non-Sri-Lankan range is trivially [0,1]
regardless of which sources are included, and anchoring Sri Lankan's raw
~1–5 exhaustion average against that already-normalized [0,1] range caused
every one of the 314 Sri Lankan rows to collapse to `harmonized_risk_norm =
1.0` (100% "Critical") — a worse, degenerate result, not a fix. That attempt
was reverted; see `target_construction_fix_results.md` for the full detail
and the exact collapse numbers. With Recommendation #1 unavailable, this task
implements Recommendation #2 instead: report the model's existing predictions
under both label conventions side by side, rather than picking one as
"corrected."

## Method

1. The 63-row Sri Lankan holdout is reconstructed deterministically via
   `train.create_sri_lankan_holdout()` (stratified `train_test_split`,
   `random_state=42`, `test_size=0.20`) applied to the current `dataset.csv`
   — the identical procedure and seed used to produce the recorded
   0.3046/0.7501 numbers. Reproducing this split and re-predicting with the
   loaded `v2.22` pipeline reproduced the recorded macro F1 (0.3046457...)
   and ROC-AUC (0.7501081...) exactly, confirming the same 63 rows and the
   same model are in use.
2. **Shared-threshold labels**: the `riskLevel` column already in
   `dataset.csv` for those 63 rows (unchanged; nothing written back).
3. **Self-quantiled labels**: `harmonized_risk_norm` for all 314 Sri Lankan
   rows quantile-binned (`q=4`) using thresholds fit within the Sri Lankan
   subset alone — reproduced the exact distribution already reported in
   `target_construction_audit.md` section 4 (Low 83/26.4%, Moderate
   105/33.4%, High 62/19.7%, Critical 64/20.4%, n=314), confirming no
   discrepancy before proceeding. Those per-row labels were then restricted
   to the same 63 holdout row indices used above (not independently
   re-split).
4. The model's predictions themselves are identical in both rows of the
   table below — only the ground-truth labels they are scored against
   differ.

## Results

| Metric | Shared-threshold labels (current `riskLevel`) | Self-quantiled labels (Sri-Lankan-only bins) |
|---|---|---|
| n | 63 | 63 |
| Accuracy | 0.4286 | 0.3968 |
| Macro F1 | 0.3046 | 0.3757 |
| Weighted F1 | 0.4679 | 0.3468 |
| ROC-AUC (OvR) | 0.7501 | 0.7208 |

### Per-class — shared-threshold labels

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Low | 0.0625 | 1.0000 | 0.1176 | 1 |
| Moderate | 0.2500 | 0.1429 | 0.1818 | 7 |
| High | 0.3333 | 0.2632 | 0.2941 | 19 |
| Critical | 0.7143 | 0.5556 | 0.6250 | 36 |

Confusion matrix (rows = true, columns = predicted; order Low, Moderate, High, Critical):
```
              Pred: Low  Mod  High  Crit
True Low        [   1,   0,   0,   0 ]
True Moderate    [   4,   1,   2,   0 ]
True High        [   6,   0,   5,   8 ]
True Critical    [   5,   3,   8,  20 ]
```

### Per-class — self-quantiled labels

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Low | 0.6250 | 0.6250 | 0.6250 | 16 |
| Moderate | 0.5000 | 0.0800 | 0.1379 | 25 |
| High | 0.2000 | 0.3000 | 0.2400 | 10 |
| Critical | 0.3571 | 0.8333 | 0.5000 | 12 |

Confusion matrix (rows = true, columns = predicted; order Low, Moderate, High, Critical):
```
              Pred: Low  Mod  High  Crit
True Low        [  10,   1,   3,   2 ]
True Moderate    [   5,   2,   8,  10 ]
True High        [   1,   0,   3,   6 ]
True Critical    [   0,   1,   1,  10 ]
```

Note the class supports differ between the two conventions even though the
63 rows and the model's predictions are identical in both — this is expected
and is itself evidence of the construct mismatch: the same 63 respondents are
distributed very differently across Low/Moderate/High/Critical depending on
which labeling convention is applied to them (e.g. "Low" support is 1 under
the shared-threshold convention vs. 16 under the self-quantiled convention).

## Interpretation

Neither version should be presented as more "correct" than the other in
isolation. They answer different questions:

- **Shared-threshold labels** answer: *how does the model's absolute risk
  scale, as calibrated on the non-Sri-Lankan training corpus, align with a
  globally-anchored cutoff when applied to Sri Lankan respondents?* This is
  the reading relevant if the model's absolute risk-tier assignment is meant
  to carry meaning across populations.
- **Self-quantiled labels** answer: *how well does the model rank Sri Lankan
  respondents relative to each other, using a risk tiering appropriate to
  their own population's distribution?* This is the reading relevant if
  only relative ranking within the Sri Lankan population matters, independent
  of how the training corpus's absolute scale is anchored.

The underlying reason two separate readings are needed at all — rather than
one settled evaluation — is the unresolved construct mismatch documented in
`target_construction_audit.md`: Sri Lankan's ground truth is built from a
locally-defined six-item `exhaustion_composite`, not the native
`burnout_score` used by the four training sources, and no fix to the
normalization anchoring alone (Recommendation #1) was found to resolve that
mismatch without producing a degenerate result. Both numbers above are
reported plainly; this report does not conclude which is more favorable to
any thesis claim.
