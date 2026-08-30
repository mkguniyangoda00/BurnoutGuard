import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { latestPrediction, checkInHistory, submitCheckIn, recommendations, reports, managerHeatmap, adminDemographic, buildCheckInPayload } from '../helpers/requests.js';
import { ensureOk, makeTokens, pickWeightedRequest, scenarioSummary } from './_shared.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 200 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 400 },
        { duration: '3m', target: 400 },
        { duration: '1m', target: 0 },
      ],
    },
  },
};

const tokens = makeTokens();
const stressBucketLatency = new Trend('stress_bucket_latency', true);
const bucketDurations = [[], [], [], [], [], [], [], [], [], [], []];
const bucketErrors = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const bucketMinutes = 1;
const stressStart = Date.now();

export default function () {
  const request = pickWeightedRequest(Math.random());
  const start = Date.now();
  let res;

  if (request === 'latestPrediction') res = latestPrediction(tokens.developer);
  else if (request === 'checkInHistory') res = checkInHistory(tokens.developer);
  else if (request === 'submitCheckIn') res = submitCheckIn(tokens.developer, buildCheckInPayload(__ITER));
  else if (request === 'recommendations') res = recommendations(tokens.developer);
  else if (request === 'reports') res = reports(tokens.developer);
  else if (request === 'managerHeatmap') res = managerHeatmap(tokens.manager);
  else res = adminDemographic(tokens.admin);

  ensureOk(res, request, [200, 201, 400, 401, 403, 404, 409]);
  const bucketIndex = Math.min(10, Math.floor((Date.now() - stressStart) / (bucketMinutes * 60 * 1000)));
  const safeBucketIndex = Math.min(bucketDurations.length - 1, bucketIndex);
  if (res.status >= 400) {
    bucketErrors[safeBucketIndex] += 1;
  }
  bucketDurations[safeBucketIndex].push(Date.now() - start);
  stressBucketLatency.add(Date.now() - start, { bucket: `${safeBucketIndex + 1}` });

  sleep(1);
}

export function handleSummary(data) {
  const buckets = bucketDurations.map((values, idx) => {
    const sorted = [...values].sort((a, b) => a - b);
    const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] : null;
    const errorRate = values.length ? bucketErrors[idx] / values.length : null;
    return { bucket: idx + 1, sampleCount: values.length, p95LatencyMs: p95, errorRate };
  }).filter((bucket) => bucket.sampleCount > 0);

  const firstOver1sBucket = buckets.find((bucket) => bucket.p95LatencyMs !== null && bucket.p95LatencyMs > 1000)?.bucket ?? null;
  const firstOver3sBucket = buckets.find((bucket) => bucket.p95LatencyMs !== null && bucket.p95LatencyMs > 3000)?.bucket ?? null;

  return scenarioSummary('stress-test', data, {
    p95Buckets: buckets,
    thresholdsCrossed: {
      p95Over1sAtBucket: firstOver1sBucket,
      p95Over3sAtBucket: firstOver3sBucket,
      errorRateOver5PctAtBucket: buckets.find((bucket) => bucket.errorRate !== null && bucket.errorRate > 0.05)?.bucket ?? null,
    },
    notes: [
      'Stress test is exploratory; no hard failure threshold enforced.',
      'Review k6 summary p95 and error-rate output to identify breaking points.',
    ],
  });
}
