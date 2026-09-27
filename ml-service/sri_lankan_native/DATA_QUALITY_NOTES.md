# Data Quality Notes: Sri Lankan-Only Survey Data

This note documents an authenticity check run on
`raw_datasets/sri_lankan_developer_burnout.csv` before it was used to build
`sri_lankan_native/sri_lankan_model_ready.csv`, and the one adjustment made as
a result (duplicate-row removal). This is not a repeat of the
global-to-local generalization diagnosis in
`../experiments/global_to_local_generalization/NEGATIVE_RESULT.md` — that
document covers a different, already-archived problem (label-construction
incompatibility across pooled external datasets). This note covers a
narrower question specific to the Sri Lankan-only pipeline: whether the raw
314-row survey file itself shows signs of fabrication or low-quality
administration, checked before any model was built on it.

## Why this check was run

A correlation-matrix review (during feature construction) found a cluster of
7 "objective" numeric features — `working_hours_per_day`,
`overtime_hours_per_week`, `urgent_tasks_per_week`, `breaks_per_workday`,
`exercise_days_per_week`, `caffeinated_drinks_per_day`,
`commute_time_minutes` — pairwise correlated at |r| = 0.6-0.74, and dominating
the correlation with `risk_level` far more than the psychological Likert
items did. This pattern (substantively unrelated real-world quantities
moving together this strongly) was unusual enough to warrant an explicit
authenticity check before building anything further on top of the dataset.

## What was checked, and what was found

**Exact duplicate rows.** 0 rows were fully identical across all 47 raw
columns including Timestamp. 6 rows (3 pairs) were identical across all 46
non-Timestamp columns — i.e., same survey answers, different submission
time. The 3 pairs, with their timestamps:

| Row indices (0-indexed) | Timestamps | Gap |
|---|---|---|
| 75, 76 | 2026-09-07 11:13:41 / 11:14:02 | 21s |
| 129, 130 | 2026-09-07 11:25:06 / 11:25:25 | 19s |
| 244, 245 | 2026-09-07 11:50:01 / 11:50:02 | 1s |

**Near-duplicate check** (same answers, differing only in role/company
size/work arrangement labels) found the same 6 rows — no additional group
beyond the 3 exact-content pairs above.

**Timestamp distribution.** All 314 submissions fall within a single
**1 hour 4 minute 46 second window** (2026-09-07 10:58:24 to 12:03:10). The
gap between consecutive submissions has a mean of 12.4 seconds and a median
of 10.0 seconds (std 5.3s, range 1-41s). 66 distinct minutes contain 2 or
more submissions, with as many as 7 submissions landing in the same minute;
every one of the 314 rows falls in a minute shared with at least one other
row.

**Formula-generation check.** The 7-feature "objective" cluster does not
mechanically determine any other field: regressing each cluster feature on
the other 6 gives R² between 0.54 and 0.70 (not ~1.0, which a deterministic
formula would produce). Regressing `exhaustion_composite` on the full
7-feature cluster gives R² = 0.4747; regressing the 6 individual exhaustion
items on the same cluster gives R² between 0.1280 and 0.2150. These values
are well below what a target computed by formula from these predictors would
show, and are consistent with genuine (if correlated) self-report data
rather than fabricated/formula-generated rows.

## Conclusion and resulting adjustment

Taken together — no fully fabricated duplicate content beyond the 3 pairs
above, moderate (not deterministic) R² between the correlated feature
cluster and the exhaustion target, and a timestamp pattern consistent with a
live or group-administered survey session (314 responses collected in 64
minutes, respondents answering roughly every 12 seconds) — this is
consistent with **real survey data collected in a single administered
session** (e.g., a classroom, workshop, or group Google Form session), not
fabricated or synthetically generated data.

**Caveat to carry forward:** a ~12-second median response time across ~40
questions is fast for genuinely reflective self-report, and the batch/
group administration pattern raises the plausibility of satisficing
(straight-lining, minimal-effort answering) and reduced independence between
responses compared to an ideal individually-and-independently-administered
survey. This is offered as a caveat on data quality, not a disqualification
— the R² checks above argue against wholesale fabrication, but do not rule
out response quality being lower than an ideal survey. This caveat should be
carried into any write-up of model results built on this data.

**Adjustment made:** the second-submitted row of each of the 3 exact-content
duplicate pairs (0-indexed rows 76, 130, 245) was dropped from
`sri_lankan_model_ready.csv`, keeping the first-submitted row of each pair.
This reduced the modeling dataset from 314 to **311 rows**. See
`dedup_rows.py` for the exact operation performed.
