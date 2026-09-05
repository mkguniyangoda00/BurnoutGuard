import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { latestPrediction, checkInHistory, submitCheckIn, recommendations, reports, managerHeatmap, adminDemographic, buildCheckInPayload } from '../helpers/requests.js';
import { ensureOk, makeTokens, pickWeightedRequest, scenarioSummary } from './_shared.js';

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: 40,
      duration: '30m',
    },
  },
};

const soakBucketLatency = new Trend('soak_bucket_latency', true);
const bucketDurations = [[], [], [], [], [], []];
const bucketMinutes = 5;
const soakStart = Date.now();

export function setup() {
  return { tokens: makeTokens() };
}

export default function (data) {
  const { tokens } = data;
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
  const bucketIndex = Math.min(5, Math.floor((Date.now() - soakStart) / (bucketMinutes * 60 * 1000)));
  bucketDurations[bucketIndex].push(Date.now() - start);
  soakBucketLatency.add(Date.now() - start, { bucket: `${bucketIndex + 1}` });

  sleep(1);
}

export function handleSummary(data) {
  const buckets = bucketDurations
    .map((values, idx) => {
      const sorted = [...values].sort((a, b) => a - b);
      const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] : null;
      return { bucket: idx + 1, sampleCount: values.length, p95LatencyMs: p95 };
    })
    .filter((bucket) => bucket.sampleCount > 0);

  const firstBucket = buckets[0];
  const finalBucket = buckets[buckets.length - 1];
  const trend = firstBucket && finalBucket && firstBucket.p95LatencyMs
    ? {
        firstBucketP95: firstBucket.p95LatencyMs,
        finalBucketP95: finalBucket.p95LatencyMs,
        increasePct: Math.round(((finalBucket.p95LatencyMs - firstBucket.p95LatencyMs) / firstBucket.p95LatencyMs) * 100),
        flagged: finalBucket.p95LatencyMs > firstBucket.p95LatencyMs * 1.2,
      }
    : { flagged: false };

  return scenarioSummary('soak-test', data, {
    p95Buckets: buckets,
    trend,
  });
}
