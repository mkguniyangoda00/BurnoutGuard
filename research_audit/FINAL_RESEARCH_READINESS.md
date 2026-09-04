# Final Research Readiness

## A. What is definitely implemented?
- End-to-end ML pipeline execution via `ml-service/run_experiment.py`.
- Source-aware Sri Lankan holdout split with 251 development rows and 63 holdout rows.
- 5x3 repeated stratified CV for all candidates.
- ML baselines: stratified dummy, most-frequent dummy, and computational heuristic.
- Paired bootstrap comparisons on internal OOF predictions.
- SHAP global and local explanations plus a bootstrap-resample stability check.
- Recommendation generation exists, but the current latest-prediction path can legitimately produce an empty recommendation list.

## B. What is partially implemented?
- Playwright coverage exists for auth, manager, HR, admin, recommendations, check-in, reports/journal, and what-if flows, but the suite is not fully clean.
- Backend-to-ML integration exists in code, but the current app evidence from E2E remains flaky in unrelated flows.

## C. What is not implemented?
- Formal k6 benchmark execution in this environment.
- A clean 20/20 Playwright result.

## D. What is contradicted by the repository?
- Any claim that Playwright is currently 20/20.
- Any claim that the repository?s formal k6 benchmark has been executed here.
- Any claim that recommendations must exist for the developer account?s latest prediction.

## E. What can safely be written in the IEEE paper?
- The system uses a source-aware holdout with a 251/63 Sri Lankan split.
- The final model selection in the executed pipeline selected LightGBM.
- The pipeline uses repeated stratified cross-validation and development-only bootstrap comparisons.

## F. What must NOT be written?
- That the repository currently has a clean 20/20 Playwright suite.
- That formal k6 benchmark numbers are available from this environment.
- Any claim that the Sri Lankan survey is only 251 rows total.
- Any claim that the recommendation page always displays cards for the current latest prediction.

## G. What evidence artifacts exist?
- `ml-service/models/experiment_results.json`
- `ml-service/models/metadata.json`
- `ml-service/models/evaluation_results.json`
- `ml-service/models/cv_results.json`
- `ml-service/models/bootstrap_comparisons.json`
- `ml-service/models/shap_results.json`
- `e2e/reports/results.json`
- `e2e/test-results/research-functional-summary.json`
- `research_audit/repository_inventory.json`
- `research_audit/data_target_audit.json`
- `research_audit/runs/playwright/run-003.json`
- `research_audit/runs/playwright/run-004.json`

## H. What remains incomplete?
- The Playwright suite still has one flaky manager flow and one flaky check-in flow in the latest two runs.
- k6 is unavailable as an executable in PATH here.
