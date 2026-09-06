# Official Grafana k6 Summary

This file records the full-duration runs executed with the official `k6` binary on September 5, 2026.

## Runs

| Scenario | Run ID | Duration | VUs | Iterations | Script Failures | Notes |
|---|---|---:|---:|---:|---:|---|
| `load-test` | `2026-09-05T17-00-00` | 7m | up to 50 | 7,577 | 0 | `http_req_duration` threshold was crossed |
| `stress-test` | `2026-09-05T17-10-00` | 11m | up to 400 | 19,895 | 0 | Backend hit Prisma connection-pool and request timeouts |
| `spike-test` | `2026-09-05T17-30-00` | 6m | up to 300 | 7,170 | 0 | Spike load exposed backend saturation and timeout conditions |
| `soak-test` | `2026-09-05T17-45-00` | 30m | 40 | 19,891 | 0 | Completed cleanly |
| `ml-service-isolated` | `2026-09-05T17-55-00` | 5m | up to 30 | 7,170 | 0 | ML service held up well |

## Artifacts

- [`perf/history/latest/load-test.json`](./history/latest/load-test.json) - mirrored latest artifact for the `load-test` run
- [`perf/history/2026-09-05T17-10-00/stress-test.json`](./history/2026-09-05T17-10-00/stress-test.json)
- [`perf/history/2026-09-05T17-30-00/spike-test.json`](./history/2026-09-05T17-30-00/spike-test.json)
- [`perf/history/2026-09-05T17-45-00/soak-test.json`](./history/2026-09-05T17-45-00/soak-test.json)
- [`perf/history/2026-09-05T17-55-00/ml-service-isolated.json`](./history/2026-09-05T17-55-00/ml-service-isolated.json)

## Takeaways

- The official k6 runner is working end-to-end in this repo.
- The API backend is the main bottleneck under `stress` and `spike`, primarily through connection-pool exhaustion and request timeouts.
- The ML service is comparatively stable in the isolated benchmark.
- The history folders now make it easy to compare future k6 iterations against these baseline runs.
