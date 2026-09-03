# BurnoutGuard Formal Performance Evaluation

## 1. Objective

This evaluation checks the existing BurnoutGuard performance infrastructure against live local services. The repository defines five benchmark scenarios: load, stress, spike, soak, and ML-service isolated. The intended benchmark schedules are preserved from the repository, but this environment did not provide a real `k6` executable, so the executable evidence collected here is smoke-level only.

## 2. Test Environment

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- ML service: `http://localhost:5001`
- Node: `v23.4.0`
- OS: `Microsoft Windows NT 10.0.22631.0`
- k6: not available on `PATH`
- Runner used: `perf/k6-lite.mjs`

Live preflight checks succeeded for:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/checkins/history`
- `GET /api/predictions/latest`
- `GET /api/recommendations`
- `GET /api/reports`
- `GET /api/analytics/heatmap` with a Manager token
- `GET /api/admin/audit` with an Admin token
- `POST /predict`
- `POST /whatif`

## 3. Methodology

- Real `k6` was not available, so the repository's fallback smoke runner was used for executable evidence.
- Authentication was real.
- Backend endpoints were real.
- ML endpoints were real.
- Workloads came from the repository scenarios.
- No thresholds were weakened.
- No mocks were used.

## 4. Scenario Configuration

| Scenario | VUs | Duration | Workload | Threshold |
| -------- | --: | -------: | -------- | --------- |
| Load | 50 | 1m ramp + 5m steady + 1m ramp-down | Mixed API profile | `http_req_duration p(95)<800ms`, `http_req_failed rate<0.01` |
| Stress | 200 to 400 | 2m + 3m + 2m + 3m + 1m | Mixed API profile | Not configured |
| Spike | 20 baseline, spike to 300 | 1m + 30s + 2m + 30s + 2m | Check-in and prediction trigger focus | Not configured |
| Soak | 40 | 30m | Mixed API profile with p95 drift tracking | Not configured |
| ML | 30 | 1m ramp + 3m steady + 1m ramp-down | Alternating `/predict` and `/whatif` | Not configured |

The repository's smoke runner executes each scenario for 10 seconds at 1 VU. That is not the intended research configuration.

## 5. Formal Results

| Scenario | Requests | Failed | Error Rate | Throughput | p50 | p90 | p95 | p99 | Max |
| -------- | -------: | -----: | ---------: | ---------: | --: | --: | --: | --: | --: |
| Load | 264 | 0 | 0% | 26.4 iterations / 10s smoke window | N/A | N/A | N/A | N/A | N/A |
| Stress | 279 | 0 | 0% | 27.9 iterations / 10s smoke window | N/A | N/A | N/A | N/A | N/A |
| Spike | 16 | 0 | 0% | 1.6 iterations / 10s smoke window | N/A | N/A | N/A | N/A | N/A |
| Soak | 275 | 0 | 0% | 27.5 iterations / 10s smoke window | N/A | N/A | N/A | N/A | N/A |
| ML Service | 920 | 0 | 0% | 92.0 iterations / 10s smoke window | N/A | N/A | N/A | N/A | N/A |

## 6. ML Performance

The ML-specific smoke run exercised alternating `POST /predict` and `POST /whatif` requests against the live ML service.

| Metric | Value |
| ------ | ----: |
| Total prediction requests | 920 |
| `/predict` requests | Not separately captured by the smoke runner |
| `/whatif` requests | Not separately captured by the smoke runner |
| Successful requests | 920 |
| Failed requests | 0 |
| Error rate | 0% |
| Throughput | 92.0 iterations / 10s smoke window |
| p50 | N/A |
| p90 | N/A |
| p95 | N/A |
| p99 | N/A |
| Max latency | N/A |
| Test duration | 10 seconds |
| VUs | 1 |

## 7. Threshold Evaluation

Load thresholds defined in the repository:

- `http_req_duration p(95) < 800ms`
- `http_req_failed rate < 0.01`

Status:

- Not formally evaluated in the smoke runner
- No thresholds were modified

## 8. Smoke Validation

The earlier smoke validation used the repository's fallback runner at approximately 1 VU for approximately 10 seconds per scenario. Those results remain separate from any formal benchmark claim.

## 9. Limitations

- No real `k6` executable was available on `PATH`.
- `winget install Grafana.k6` failed because the msstore source certificate validation failed.
- `choco install k6` failed because the environment would not permit the required Chocolatey lock/file access.
- Full-duration benchmark schedules from the repository could not be executed.
- Reported values are smoke-level evidence only.
- k6-lite does not emit the full latency histogram metrics requested for formal reporting.
- The live backend did not expose the original research-factor route used by the load mix.

## 10. Research Interpretation

The smoke runs show that the live backend and ML service were operational and could sustain short bursts of authenticated traffic without failures. They do not demonstrate the repository's intended full-load, stress, spike, or soak behavior because the required `k6` executable was unavailable and the benchmark schedules were not executed.

The original research-factor endpoint used by the load mix was not reachable in the current backend. For smoke evidence, the harness was updated to use `/api/admin/audit`, which is a real authenticated endpoint. That replacement keeps the benchmark authenticated and live, but it is still a smoke-level accommodation rather than the intended formal benchmark.

For the IEEE paper, include the scenario design and the smoke evidence only as operational preflight evidence. Do not present these smoke results as the formal benchmark. The manuscript should explicitly say that formal performance evaluation was not fully completed in this environment.
