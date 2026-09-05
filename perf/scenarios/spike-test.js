import { sleep } from 'k6';
import { check } from 'k6';
import { latestPrediction, submitCheckIn, triggerPrediction, buildCheckInPayload } from '../helpers/requests.js';
import { ensureOk, makeTokens, scenarioSummary } from './_shared.js';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 20 },
        { duration: '30s', target: 300 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 300 },
        { duration: '2m', target: 20 },
      ],
    },
  },
};

let spikeCount = 0;
let spikeRecoveryStart = null;
let baselineP95 = null;

export function setup() {
  return { tokens: makeTokens() };
}

export default function (data) {
  const { tokens } = data;
  const isSpike = __VU > 20;
  const start = Date.now();

  if (isSpike) {
    spikeCount += 1;
    if (spikeRecoveryStart === null) spikeRecoveryStart = Date.now();
  }

  const checkInRes = submitCheckIn(tokens.developer, buildCheckInPayload(__ITER));
  ensureOk(checkInRes, 'submitCheckIn', [200, 201]);
  const triggerRes = triggerPrediction(tokens.developer);
  check(triggerRes, {
    'trigger accepted': (r) => r.status >= 200 && r.status < 500,
  });

  const latestRes = latestPrediction(tokens.developer);
  ensureOk(latestRes, 'latestPrediction');

  if (!isSpike && baselineP95 === null) {
    baselineP95 = Date.now() - start;
  }
  if (!isSpike && spikeRecoveryStart !== null) {
    console.log(`Recovered to baseline after ${Math.round((Date.now() - spikeRecoveryStart) / 1000)}s`);
    spikeRecoveryStart = null;
  }

  sleep(1);
}

export function handleSummary(data) {
  return scenarioSummary('spike-test', data, {
    recovery: {
      baselineObserved: baselineP95 !== null,
      spikeCount,
    },
  });
}
