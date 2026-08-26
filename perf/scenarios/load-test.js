import http from 'k6/http';
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
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
  thresholds: sharedThresholds,
  scenarios: {
    load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },
  },
};

const managerToken = login('Manager');
const adminToken = login('Admin');
const developerToken = login('Developer');

const tokenPool = new SharedArray('tokens', () => [developerToken, managerToken, adminToken]);

export default function () {
  const token = tokenPool[__ITER % tokenPool.length];
  const r = Math.random();

  if (r < 0.30) latestPrediction(token);
  else if (r < 0.45) checkInHistory(token);
  else if (r < 0.55) submitCheckIn(token, buildCheckInPayload(__ITER));
  else if (r < 0.70) recommendations(token);
  else if (r < 0.80) reports(token);
  else if (r < 0.90) managerHeatmap(managerToken);
  else adminDemographic(adminToken);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/load-test.json': JSON.stringify(data, null, 2),
    'reports/load-test.html': htmlReport(data),
  };
}
