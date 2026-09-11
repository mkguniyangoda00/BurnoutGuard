# Target Construction Audit: Training Label vs. Sri Lankan Holdout Label

**Scope:** read-only investigation. No code changed, nothing retrained.

## Direct answer

**No — the two labels are not built via a fully equivalent procedure.** The
final categorical binning *function and threshold values* are literally
shared (one call, one set of quantile edges, applied to every row). But the
*raw field* those thresholds are applied to is constructed differently for
Sri Lankan rows than for the four other sources, and it is normalized against
a different population. Because the shared thresholds are absolute cut points
on a [0,1] scale, and that [0,1] scale means something different for each
population's own min/max, the shared-threshold step does not actually
guarantee comparable class semantics between the two populations. This is
demonstrated quantitatively in section 4 below: it produces a Sri Lankan class
distribution skewed to 57.3% "Critical" that largely dissolves into a roughly
balanced distribution if Sri Lankan is instead quantile-binned on its own
terms — meaning the reported skew is at least partly a construction artifact,
not necessarily a real prevalence signal.

## 1. Training target construction (4 non-Sri-Lankan sources)

**File:** [ml-service/harmonize_datasets.py](harmonize_datasets.py)
**Function:** `harmonize_mental_health_burnout_tech()` (line 124),
`harmonize_tech_mental_health()` (line 144), `harmonize_indian_developer()`
(line 163), `harmonize_wfh_dataset()` (line ~178) — each ends with the same
one-line pattern:
```python
out["harmonized_risk_norm"] = minmax_norm(df["burnout_score"])
```
`minmax_norm()` is defined at lines 82-91.

Then the categorical label is produced in a separate file:

**File:** [ml-service/generate_dataset.py](generate_dataset.py)
**Function:** `create_risk_labels()` (lines 122-206), called from `main()`
at lines 383-386.

- **Raw field:** each source dataset's own native `burnout_score` column.
- **Normalization:** min-max normalized to [0,1] **within its own source
  dataset** (`minmax_norm`, harmonize_datasets.py:82-91) — i.e. per-dataset,
  before the four sources are concatenated.
- **Binning:** `pd.qcut(reference, q=4, ...)` (generate_dataset.py:169) fits
  quantile edges for 4 equiprobable classes (Low/Moderate/High/Critical) —
  but the `reference` used to *fit* those edges is restricted to non-Sri-Lankan
  rows only (`threshold_reference` at generate_dataset.py:379-382). The
  resulting edges (`q25=0.0704`, `q50=0.2535`, `q75=0.4900`) are then applied
  via `pd.cut()` (generate_dataset.py:170-175) to the **combined** `label_source`
  column covering all 257,114 rows, non-Sri-Lankan and Sri Lankan alike, in
  one call.
- **Per-source vs. combined:** the min-max normalization step (`harmonized_risk_norm`)
  is computed **per source dataset**, before concatenation. The quantile
  threshold-*fitting* step is computed once, across the pooled non-Sri-Lankan
  corpus. The binning-*application* step is a single shared step applied to
  the full combined corpus (all 5 sources) at once.

## 2. Sri Lankan holdout label construction

**File:** [ml-service/harmonize_datasets.py](harmonize_datasets.py)
**Function:** `harmonize_sri_lankan_survey()`, lines 330-337:
```python
exhaustion = df[exhaustion_cols].apply(pd.to_numeric, errors="coerce")
...
out["burnout_measurement"] = exhaustion.mean(axis=1)
out["exhaustion_composite"] = out["burnout_measurement"]
out["harmonized_risk_norm"] = minmax_norm(out["burnout_measurement"])
out["target_measurement_source"] = "six-item observed exhaustion composite"
```
`exhaustion_cols` are the six 1-5 Likert items listed in
`SRI_LANKAN_EXHAUSTION_ITEMS` (lines 59-66): "How often do you feel tired?",
"...physically exhausted?", "...emotionally exhausted?", "...I can't take it
anymore?", "...feel worn out?", "...weak and susceptible to illness?".

The categorical label for these rows is then produced by the **same call** to
`create_risk_labels()` referenced above (generate_dataset.py:383-386) — there
is no separate Sri-Lankan-specific binning function.

- **Raw field:** the 6-item `exhaustion_composite` (a simple row-wise mean of
  six Likert items), **not** `burnout_score` — the Sri Lankan survey has no
  such field (confirmed in `harmonize_sri_lankan_survey()`'s own docstring,
  lines 185-186: "The survey has no single burnout_score field").
- **Normalization:** min-max normalized to [0,1] via the identical
  `minmax_norm()` function, but computed **within the 314-row Sri Lankan
  subset only** — its own min and max, not the training corpus's.
- **Binning:** the categorical cut uses the exact same quantile edges that
  were fit on the non-Sri-Lankan reference (i.e. **not** independently binned
  within the Sri Lankan subset — the code deliberately avoids that, per the
  comment at generate_dataset.py:377-378, "Fit thresholds on non-Sri Lankan
  sources only. This prevents the later Sri Lankan external holdout from
  influencing target-label construction").

## 3. Same or different procedure?

Splitting this into its three sub-steps:

| Step | Non-Sri-Lankan | Sri Lankan | Same? |
|---|---|---|---|
| Raw field | `burnout_score` (native per source) | `exhaustion_composite` (6-item mean, survey-specific) | **Different** |
| Min-max normalization population | within each source's own rows | within Sri Lankan's own 314 rows | Same *formula*, different *population it's anchored to* |
| Threshold-fitting population | non-Sri-Lankan pooled rows | (not independently fit — reuses the above) | **Shared thresholds** (by design, correctly avoids holdout leakage into fitting) |
| Threshold-application | `pd.cut` on combined corpus | `pd.cut` on combined corpus, same call | **Same code, same threshold values** |

So: the **binning code path and threshold values are identical** and
correctly leakage-free (Sri Lankan rows never influence where the cut points
land — this is good practice and should be kept). But the **input each
population feeds into that shared cut is not measuring the same thing on the
same scale**: `burnout_score` is each source's own validated/native burnout
metric, min-max rescaled per source; `exhaustion_composite` is a
locally-defined 6-item survey average, min-max rescaled only against other
Sri Lankan respondents. A Sri Lankan respondent's harmonized value of, say,
0.9 means "close to the most-exhausted person in this 314-person sample," and
a non-Sri-Lankan respondent's 0.9 means "close to the highest `burnout_score`
in their (100k+ row) source dataset" — these are not directly comparable
quantities, even though both get compared against the same absolute cut point
of 0.49. This is "same downstream formula, different and non-comparable
input construction" — closer to the **different-procedure / problem case**
than to a clean "same formula, different population" situation, because the
per-population min-max anchoring breaks the assumption that a shared
threshold has consistent meaning.

## 4. Quantified impact

Sri Lankan `riskLevel` distribution as actually produced by the current
pipeline (`dataset.csv`, `source_dataset == "sri_lankan_developer_burnout"`,
n=314):

| Class | Count | % |
|---|---|---|
| Low | 6 | 1.9% |
| Moderate | 35 | 11.1% |
| High | 93 | 29.6% |
| Critical | 180 | 57.3% |

For comparison, if Sri Lankan's `harmonized_risk_norm` were instead binned
using quantile edges **fit within the Sri Lankan subset itself**
(`pd.qcut(sl['harmonized_risk_norm'], q=4)`, computed read-only for this audit,
not applied anywhere in the pipeline) — i.e. treating Sri Lankan the same way
each *training* source is allowed to define its own normalization terms,
rather than importing another population's absolute cut points — the
distribution is close to balanced:

| Class | Count | % |
|---|---|---|
| Low | 83 | 26.4% |
| Moderate | 105 | 33.4% |
| High | 62 | 19.7% |
| Critical | 64 | 20.4% |

This is a large shift (57.3% → 20.4% "Critical"; 1.9% → 26.4% "Low"). It shows
the current 57.3%-Critical concentration in the Sri Lankan sample is highly
sensitive to the shared-threshold-on-differently-anchored-input construction,
and should not be read as strong evidence that Sri Lankan developers are
disproportionately in the Critical burnout tier — it may equally reflect that
the non-Sri-Lankan-derived thresholds (fit on `burnout_score`-based
`harmonized_risk_norm`) simply sit at different absolute positions than
Sri Lankan's own exhaustion-composite scale happens to occupy.

## 5. What the existing audit files already say

**`ml-service/dataset_target_construction_metadata.json`** documents the
*shared-threshold* mechanism (it's the authoritative source for the actual
numbers used above) but does **not** flag the raw-field mismatch:
```json
"canonical_target_source": "burnout_score from each source dataset (min-max normalized within dataset)",
"quantile_thresholds": {"q0": 0.0, "q25": 0.0704225352112676, "q50": 0.2535211267605634, "q75": 0.49, "q100": 1.0},
"quantile_threshold_fit_source": "non-Sri Lankan development sources only",
"sources_without_burnout_measurement": ["sri_lankan_developer_burnout"]
```
`sources_without_burnout_measurement` is the only hint here that Sri Lankan is
constructed differently — it doesn't spell out that the actual raw field used
instead is a different (6-item exhaustion) construct, nor discuss the
per-population min-max anchoring issue.

**`research_audit/data_target_audit.json`** states this more directly and is
the closer match to this question:
```json
"targetSource": "burnout_score from non-Sri-Lankan source datasets; Sri Lankan survey uses six-item observed exhaustion composite for external evaluation only",
"status": { "targetLeakageFree": "PARTIALLY IMPLEMENTED" }
```
This confirms the raw-field mismatch in plain language, and its own
`"targetLeakageFree": "PARTIALLY IMPLEMENTED"` status is consistent with this
audit's finding that the construction, while leakage-free with respect to
threshold *fitting*, is not a fully equivalent procedure end-to-end. Neither
file quantifies the resulting class-distribution sensitivity computed in
section 4 — that analysis is new to this audit.

## Recommendation

Do not present the Sri Lankan external holdout's macro F1 (0.3046) and
ROC-AUC (0.7501) figures without a caveat — the ground-truth label they are
measured against is constructed from a different raw field, anchored to a
different normalization population, than the label the model was trained
against. Two concrete fixes, in order of preference:

1. **Anchor Sri Lankan's min-max normalization to the pooled non-Sri-Lankan
   `harmonized_risk_norm` range instead of its own 314-row min/max**, so "0"
   and "1" mean the same relative position for both populations before the
   shared thresholds are applied. This doesn't solve the underlying
   raw-field mismatch (`burnout_score` vs. `exhaustion_composite` remain
   different constructs) but removes the double-normalization distortion
   quantified in section 4, which is the larger and more fixable of the two
   problems.
2. **Report Sri Lankan results under both binning conventions** — the current
   shared-threshold numbers, and a within-Sri-Lankan-quantile-fit version —
   and disclose the resulting shift in class balance (as in section 4) as an
   explicit limitation, rather than silently picking one. This does not
   require any pipeline change, only additional reporting.

Either way, the thesis's Internal Validity paragraph should state plainly
that the Sri Lankan ground-truth label is a locally-constructed 6-item
exhaustion proxy (not a validated burnout measure comparable to the other
four sources' native `burnout_score`), consistent with what
`research_audit/data_target_audit.json` already documents, and that the
57.3%-Critical skew in the raw Sri Lankan label is sensitive to the
normalization choice rather than fully attributable to the source population.
