import { sleep, check } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { login } from '../helpers/auth.js';
import { submitCheckIn, triggerPrediction, buildCheckInPayload } from '../helpers/requests.js';

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

const token = login('Developer');
let baselineP95 = null;
let spikeStart = null;

export default function () {
  const checkInRes = submitCheckIn(token, buildCheckInPayload(__ITER));
  check(checkInRes, { 'checkin status ok': (r) => r.status === 201 || r.status === 200 });
  const triggerRes = triggerPrediction(token);
  check(triggerRes, { 'trigger status ok': (r) => r.status >= 200 && r.status < 500 });

  if (__VU <= 20 && baselineP95 === null) baselineP95 = Date.now();
  if (__VU >= 300 && spikeStart === null) spikeStart = Date.now();
  if (spikeStart && __VU <= 20) {
    const recovery = Date.now() - spikeStart;
    console.log(`Recovered after ${Math.round(recovery / 1000)}s from spike`);
    spikeStart = null;
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/spike-test.json': JSON.stringify(data, null, 2),
    'reports/spike-test.html': htmlReport(data),
  };
}
