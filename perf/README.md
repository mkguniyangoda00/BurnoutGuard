# BurnoutGuard k6 Perf

This directory contains k6 scripts for exercising the main BurnoutGuard API and the ML service.

## Prerequisites

- `k6` installed locally and available on `PATH`
- BurnoutGuard backend running on `http://localhost:5000`
- ML service running on `http://localhost:5001`
- Seeded users available with the credentials in `perf/config.js`

## Shared Conventions

- Base API URL: `http://localhost:5000/api`
- ML service URL: `http://localhost:5001`
- Reports are written to `perf/reports/<scenario>.json` and `perf/reports/<scenario>.html`
- Historical runs are archived under `perf/history/<run-id>/<scenario>.json` and `perf/history/<run-id>/<scenario>.html`
- The most recent run for each scenario is also mirrored to `perf/history/latest/<scenario>.json`
- All scripts use seeded JWT login via `POST /auth/login`

## Quick Smoke Check

Run each scenario for 10 seconds with 1 VU before the full-duration test:

```bash
k6 run --vus 1 --duration 10s perf/scenarios/load-test.js
k6 run --vus 1 --duration 10s perf/scenarios/stress-test.js
k6 run --vus 1 --duration 10s perf/scenarios/spike-test.js
k6 run --vus 1 --duration 10s perf/scenarios/soak-test.js
k6 run --vus 1 --duration 10s perf/scenarios/ml-service-isolated.js
```

## Full Runs

- `npm run load`
- `npm run stress`
- `npm run spike`
- `npm run soak`
- `npm run ml`

## History Runs

These commands keep the latest report and also archive a timestamped copy for comparison across Grafana k6 iterations:

- `npm run load:history`
- `npm run stress:history`
- `npm run spike:history`
- `npm run soak:history`
- `npm run ml:history`

## Notes

- `load-test.js` targets the normal mixed API profile with thresholds enabled.
- `stress-test.js` is exploratory and intentionally has no hard fail threshold.
- `spike-test.js` concentrates on `POST /checkins` and `POST /predictions/trigger`.
- `soak-test.js` records 5-minute buckets and flags upward p95 drift.
- `ml-service-isolated.js` bypasses the Node backend and exercises Flask directly.
