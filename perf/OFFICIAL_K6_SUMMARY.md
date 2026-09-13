# Official Grafana k6 Summary

## Baseline run — 2026-09-05

This section records the original full-duration runs executed with the official `k6` binary on September 5, 2026, before any backend fixes.

| Scenario | Run ID | Duration | VUs | Iterations | Script Failures | Notes |
|---|---|---:|---:|---:|---:|---|
| `load-test` | `2026-09-05T17-00-00` | 7m | up to 50 | 7,577 | 0 | `http_req_duration` threshold was crossed |
| `stress-test` | `2026-09-05T17-10-00` | 11m | up to 400 | 19,895 | 0 | Backend hit Prisma connection-pool and request timeouts |
| `spike-test` | `2026-09-05T17-30-00` | 6m | up to 300 | 7,170 | 0 | Spike load exposed backend saturation and timeout conditions |
| `soak-test` | `2026-09-05T17-45-00` | 30m | 40 | 19,891 | 0 | Completed cleanly |
| `ml-service-isolated` | `2026-09-05T17-55-00` | 5m | up to 30 | 7,170 | 0 | ML service held up well |

Baseline artifacts: `perf/history/2026-09-05T17-*/`.

---

## Final official verification — 2026-09-11

Re-run after the connection-pool, N+1, unbounded-query, and dedup fixes described in the investigation/fix history. Run with the **official `k6` binary** (`tools/k6/k6-v2.2.0-windows-amd64/k6.exe`) against the **unmodified official scripts** in `perf/scenarios/`. No thresholds, VU counts, durations, scenarios, checks, or expected status codes were changed. `--summary-trend-stats` was added as a CLI reporting flag only (it does not alter test behavior) to additionally surface p99.

**Two prior attempts on 2026-09-10/11 failed** before this final clean run — that history is reported honestly in [Verification history](#verification-history-before-the-final-clean-run) below, because it surfaced a real bug that is now fixed.

Raw JSON reports for this final run are preserved at `perf/reports/FINALV2_<scenario>.json`.

### LOAD-TEST — PASS

Official thresholds (`perf/config.js`): `http_req_duration: p(95)<800`, `http_req_failed: rate<0.01`.

| Metric | Value |
|---|---|
| VUs | ramped 0→50 (1m up, 5m hold, 1m down) |
| Duration | 7m |
| Total requests | 17,679 |
| Request rate | 41.94 req/s |
| p50 | 12.0 ms |
| p90 | 38.5 ms |
| p95 | **73.6 ms** (threshold: <800ms) |
| p99 | 111.9 ms |
| Failure rate | **0%** (threshold: <1%) |
| Checks | 17,683 passed / 0 failed (100%) |
| Threshold status | **PASS** — k6 exit code 0, no "thresholds crossed" message |
| HTTP status distribution | ~100% 200/201 (allowed set is `[200,201]`; 0 requests fell outside it) |
| Notable backend errors | None |

**Baseline comparison**: baseline reported the `http_req_duration` threshold **crossed**. This run **passes** the same threshold outright, at more than 2x baseline throughput (17,679 vs 7,577 iterations).

### STRESS-TEST — PASS (no hard threshold defined; reported against script's own exploratory intent)

`perf/scenarios/stress-test.js` defines no `thresholds` block by design ("Stress test is exploratory; no hard failure threshold enforced" — script comment). There is therefore no official numeric bar for k6 itself to fail against; PASS here means k6 exited 0 and the allowed-status checks (`[200,201,400,401,403,404,409]`) held.

| Metric | Value |
|---|---|
| VUs | ramped 200→400 (2m@200, 3m@200, 2m ramp to 400, 3m@400, 1m down) |
| Duration | 11m |
| Total requests | 97,933 |
| Request rate | 147.8 req/s |
| p50 | 259.5 ms |
| p90 | 1,802.6 ms |
| p95 | 2,625.4 ms |
| p99 | 5,710.2 ms |
| Failure rate | 0% |
| Checks | 97,937 passed / 0 failed (100%) |
| Threshold status | **PASS** (no threshold defined; exit code 0) |
| HTTP status distribution | 100% within allowed set `[200,201,400,401,403,404,409]` |
| Notable backend errors | None this run |

**Baseline comparison**: baseline reported p95≈52.8s and ~7.0% failures ("Prisma connection-pool exhaustion"). This run: p95=2.6s (95% reduction), 0% failures.

### SPIKE-TEST — PASS (no hard threshold defined)

`perf/scenarios/spike-test.js` also defines no `thresholds` block.

| Metric | Value |
|---|---|
| VUs | ramped, peaks at 300 (1m@20, 30s@300, 2m@20, 30s@300, 2m@20) |
| Duration | 6m |
| Total requests | 13,138 |
| Request rate | 36.1 req/s |
| p50 | 2,567.1 ms |
| p90 | 8,399.7 ms |
| p95 | 9,650.6 ms |
| p99 | 12,216.7 ms |
| Failure rate | 1.64% (216 / 13,138) |
| Checks | 12,926 passed / 216 failed (98.36%) |
| Threshold status | **PASS** (no threshold defined; exit code 0) — but note the 1.64% check-failure rate below |
| HTTP status distribution | 98.36% within allowed sets (`submitCheckIn`/`latestPrediction`: `[200,201]`; `triggerPrediction`: any status <500); the 1.64% failures are our own 503 "Request timed out" responses fired during the 300-VU bursts |
| Notable backend errors | 503s from the Express request-timeout middleware during the two 300-VU spike bursts |

**Baseline comparison**: baseline reported ~37.7% failures ("backend saturation"). This run: 1.64% failures — a 96% reduction, but not zero; spikes to 300 VUs still transiently saturate the connection pool for a slice of requests.

### SOAK-TEST — PASS with a caveat (no hard threshold defined; one anomalous stall)

`perf/scenarios/soak-test.js` defines no `thresholds` block.

| Metric | Value |
|---|---|
| VUs | constant 40 |
| Nominal duration | 30m |
| Actual wall-clock duration | 58m26s (see caveat below) |
| Total requests | 66,412 |
| Request rate | 18.9 req/s |
| p50 | 8.7 ms |
| p90 | 227.4 ms |
| p95 | 311.1 ms |
| p99 | 661.2 ms |
| Failure rate | 0.006% (4 / 66,412) |
| Checks | 66,412 passed / 4 failed (99.994%) |
| Threshold status | **PASS** (no threshold defined; exit code 0) |
| HTTP status distribution | 99.994% within allowed set `[200,201,400,401,403,404,409]` |
| Notable backend errors | A cluster of ~8 requests (`POST /checkins`, `GET /analytics/heatmap`) stalled for **~29 minutes** before resolving (some 201/200, some 503 after our own 15s timeout fired) — see [Remaining Bottlenecks](#remaining-bottlenecks) |

**Baseline comparison**: baseline reported "100% of 19,899 checks passed" with no p95 published. This run passed 99.994% of 66,412 checks (3.3x baseline throughput at the same 40 VUs) — very close to, but not literally matching, the baseline's 100% figure, and it surfaced a real tail-latency defect the baseline run apparently did not hit (or did not run long/hard enough beforehand to hit — see verification history below).

### ML-SERVICE-ISOLATED — PASS

`perf/scenarios/ml-service-isolated.js` defines no `thresholds` block; this benchmark bypasses the Node backend entirely.

| Metric | Value |
|---|---|
| VUs | ramped 0→30 (1m up, 3m hold, 1m down) |
| Duration | 5m |
| Total requests | 6,765 |
| Request rate | 22.5 req/s |
| p50 | 8.6 ms |
| p90 | 18.0 ms |
| p95 | **28.1 ms** |
| p99 | 91.4 ms |
| Failure rate | 0% |
| Checks | 6,765 passed / 0 failed (100%) |
| Threshold status | **PASS** (no threshold defined; exit code 0) |
| HTTP status distribution | 100% status 200 (`ensureOk` allowed set is `[200]` only) |
| Notable backend errors | None (one isolated 13.1s outlier request; p99 is still 91ms, so this did not affect the overall isolated ML result) |

**Baseline comparison**: baseline p95=18.5ms, 100% passed. This run: p95=28.1ms, 100% passed. Essentially unchanged and still fully healthy — consistent with the conclusion that the ML service was never the bottleneck.

---

## Before / after comparison table

| Scenario | Baseline (2026-09-05) | Final (2026-09-11) | Threshold status |
|---|---|---|---|
| load-test | p95 threshold **crossed**, 7,577 iters | p95=73.6ms (<800ms), 0% failed, 17,679 iters | **PASS** |
| stress-test | p95≈52.8s, ~7.0% failures | p95=2.6s, 0% failures, 97,933 iters | **PASS** (no hard threshold) |
| spike-test | ~37.7% failures | p95=9.65s, 1.64% failures, 13,138 iters | **PASS** (no hard threshold) |
| soak-test | 100% of 19,899 checks passed | 99.994% of 66,412 checks passed | **PASS**, with one tail-latency anomaly |
| ml-service-isolated | p95=18.5ms, 100% passed | p95=28.1ms, 100% passed | **PASS** |

---

## Is the Node/Express/Prisma API tier still the primary bottleneck? Is ML still non-bottlenecked?

**Yes to both, with more precision now than in the original investigation.**

Every failure and latency spike observed across all verification attempts — including the two failed attempts below — traced to the Express/Prisma/MySQL tier: connection-pool sizing, an unbounded analytics query, missing indexes, and (newly discovered) the absence of a query-level timeout. None of it involved the ML service. `ml-service-isolated` remained flat and fast (p95 18–28ms) across every run in this verification, including the run where the API tier itself experienced a 29-minute stall — direct evidence the ML service is architecturally isolated from the API tier's problems and is not a contributing factor.

## Verification history before the final clean run

Full transparency on how this final result was reached, per the instruction not to claim success prematurely:

1. **First attempt** (fresh backend, but DB still holding ~9-12k rows per table from earlier fix-development testing): `load-test` **FAILED** its threshold (p95=3.1s vs 800ms limit). Root cause: `GET /checkins/history` and `GET /recommendations` had grown to multi-megabyte responses because the single seeded `Developer` account shared by every k6 VU had accumulated a large history across many prior manual test runs in this environment. This was a pre-existing condition of the test data, not a new code regression, but it invalidated a fair comparison — the seeded test accounts' data was reset (recommendations/check-ins/predictions/SHAP rows/alerts) and the suite re-run.
2. **Second attempt** (data reset, backend restarted, full 5-scenario sequence run back-to-back): `load-test`, `stress-test`, and `spike-test` all passed cleanly, but `soak-test` **FAILED badly** — 9.06% check failures, p95=23.8s, one request took 972 seconds, and the test overran its 30-minute window to 40 minutes. Investigation of the backend log found a single `GET /analytics/heatmap` request that took **973 seconds**. Root cause: a genuine bug in an earlier fix to `AnalyticsService.getTeamHeatmap` — batching the original per-developer queries into one `findMany` had dropped the original per-developer `take: 4` cap, making the batched query unbounded. Because the shared test account's own prediction history grows continuously during the load/stress/spike stages that precede soak (and those rows are also the *most recent* globally, since they're being created live), that one account's history came to dominate an unbounded, globally-ordered query, both scanning enormous amounts of data and starving other developers of their own results. **This was fixed** by rewriting the query as a single bounded window-function query (`ROW_NUMBER() OVER (PARTITION BY userId ...) <= 4`, via `prisma.$queryRaw`), which is correct and bounded regardless of skew. An index was also added on `AuditLog.createdDateTime`, since a 91,719-row unindexed sort on `GET /admin/audit` was found contributing to the same pileup. Data was reset again and the full suite re-run.
3. **Third attempt — this final run** — reported above. All five scenarios passed their official (or, where none is defined, their exit-code/check-based) bar, with the one caveat noted for soak-test.

This progression is itself evidence supporting the report's conclusions: every failure encountered, including the two that required additional fixes, was in the Node/Express/Prisma/MySQL tier — never in the ML service.

## Remaining bottlenecks

- **No query-level timeout on Prisma/MySQL.** The soak-test's ~29-minute stall on a cluster of requests shows that while `connection_limit`/`pool_timeout` bound how long a request waits *for* a connection, and the Express-level `res.setTimeout` bounds how long the *client* waits for a response, nothing bounds how long an already-running query can hold its connection once acquired. A stuck or pathologically slow query (from a lock, an I/O stall, or resource contention) can occupy a pool slot indefinitely, which is a systemic risk under sustained load. Recommended follow-up: add a MySQL statement/interactive-transaction timeout (e.g. via `SET SESSION MAX_EXECUTION_TIME` per query, or Prisma's `maxWait`/`timeout` options on `$transaction`), and/or wire query cancellation to the existing HTTP-level timeout.
- **Performance is sensitive to the total historical row count of a single heavily-active account**, not just concurrent request volume. This verification's own middle attempt reproduced the pattern the original investigation predicted (`markPreviousAsNotLatest`, unbounded reads) in a *new* location (`getTeamHeatmap`) that wasn't part of the original fix set. This suggests an audit for any other query that batches across users without a per-user bound would be worthwhile before this is considered fully closed out.
- **Spike-test's 1.64% failure rate** shows the connection pool can still be transiently saturated by a sudden 20→300 VU jump, even though it recovers within the same test. This is a smaller, second-order finding relative to the two above.

---

## OVERALL OFFICIAL K6 STATUS: PASS

LOAD: PASS
STRESS: PASS
SPIKE: PASS
SOAK: PASS
ML SERVICE ISOLATED: PASS

REMAINING BOTTLENECKS:
- No query/statement-level timeout on Prisma/MySQL connections (a stuck query can hold a pool connection indefinitely; observed as a ~29-minute stall on a handful of soak-test requests).
- Performance still depends on keeping per-user/per-query result sets bounded — a new instance of this class of bug (unbounded `getTeamHeatmap` query) was found and fixed during this very verification pass, suggesting other unaudited spots may exist.
- Spike-test shows a small (1.64%) but non-zero failure rate under a sudden 20→300 VU jump.

## Artifacts

- Baseline: `perf/history/2026-09-05T17-*/`
- Final verification (raw JSON, preserved): `perf/reports/FINALV2_load-test.json`, `FINALV2_stress-test.json`, `FINALV2_spike-test.json`, `FINALV2_soak-test.json`, `FINALV2_ml-service-isolated.json`
- Interim (failed) attempts, also preserved for the record: `perf/reports/load-test.json` history under run IDs `2026-09-10T-final-verification` and `2026-09-11T-final-verification-v2` in `perf/history/`
