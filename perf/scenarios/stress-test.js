import { sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { sharedThresholds } from '../config.js';
import { login } from '../helpers/auth.js';
import {
  latestPrediction,
  checkInHistory,
  submitCheckIn,
  recommendations,
  reports,
  managerHeatmap,
  adminDemographic,
  buildCheckInPayload,
} from '../helpers/requests.js';

export const options = {
  thresholds: {},
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

const managerToken = login('Manager');
const adminToken = login('Admin');
const developerToken = login('Developer');

let crossed1s = false;
let crossed3s = false;
let error5Logged = false;

export default function () {
  const token = __ITER % 3 === 0 ? developerToken : __ITER % 3 === 1 ? managerToken : adminToken;
  const r = Math.random();
  const start = Date.now();
  let res;

  if (r < 0.30) res = latestPrediction(token);
  else if (r < 0.45) res = checkInHistory(token);
  else if (r < 0.55) res = submitCheckIn(token, buildCheckInPayload(__ITER));
  else if (r < 0.70) res = recommendations(token);
  else if (r < 0.80) res = reports(token);
  else if (r < 0.90) res = managerHeatmap(managerToken);
  else res = adminDemographic(adminToken);

  const elapsed = Date.now() - start;
  if (!crossed1s && elapsed > 1000) {
    crossed1s = true;
    console.log(`p95 latency crossed 1s at VU ${__VU}`);
  }
  if (!crossed3s && elapsed > 3000) {
    crossed3s = true;
    console.log(`p95 latency crossed 3s at VU ${__VU}`);
  }
  if (!error5Logged && res.status >= 400 && __ITER > 0) {
    const errRate = __ITER / (__ITER + 1);
    if (errRate > 0.05) {
      error5Logged = true;
      console.log(`error rate exceeded 5% near VU ${__VU}`);
    }
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/stress-test.json': JSON.stringify(data, null, 2),
    'reports/stress-test.html': htmlReport(data),
  };
}
