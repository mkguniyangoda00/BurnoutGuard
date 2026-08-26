import { sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
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
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: 40,
      duration: '30m',
    },
  },
};

const managerToken = login('Manager');
const adminToken = login('Admin');
const developerToken = login('Developer');

const p95Buckets = [];

export default function () {
  const token = __ITER % 3 === 0 ? developerToken : __ITER % 3 === 1 ? managerToken : adminToken;
  const r = Math.random();

  if (r < 0.30) latestPrediction(token);
  else if (r < 0.45) checkInHistory(token);
  else if (r < 0.55) submitCheckIn(token, buildCheckInPayload(__ITER));
  else if (r < 0.70) recommendations(token);
  else if (r < 0.80) reports(token);
  else if (r < 0.90) managerHeatmap(managerToken);
  else adminDemographic(adminToken);

  if (__ITER % 100 === 0) {
    p95Buckets.push(Date.now());
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/soak-test.json': JSON.stringify({ ...data, bucketMarkers: p95Buckets }, null, 2),
    'reports/soak-test.html': htmlReport(data),
  };
}
