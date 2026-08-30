import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { check, fail } from 'k6';
import { SharedArray } from 'k6/data';
import { login } from '../helpers/auth.js';

export const REQUEST_WEIGHTS = [
  { label: 'latestPrediction', weight: 30 },
  { label: 'checkInHistory', weight: 15 },
  { label: 'submitCheckIn', weight: 10 },
  { label: 'recommendations', weight: 15 },
  { label: 'reports', weight: 10 },
  { label: 'managerHeatmap', weight: 10 },
  { label: 'adminDemographic', weight: 10 },
];

export function makeTokens() {
  return new SharedArray('burnoutguard-tokens', () => ([
    {
      developer: login('Developer'),
      manager: login('Manager'),
      admin: login('Admin'),
      researchAdmin: login('ResearchAdmin'),
    },
  ]))[0];
}

export function pickWeightedRequest(randomValue) {
  let cursor = 0;
  for (const entry of REQUEST_WEIGHTS) {
    cursor += entry.weight / 100;
    if (randomValue < cursor) return entry.label;
  }
  return REQUEST_WEIGHTS[REQUEST_WEIGHTS.length - 1].label;
}

export function ensureOk(res, label, allowed = [200, 201]) {
  check(res, {
    [`${label} status ok`]: (r) => allowed.includes(r.status),
  }) || fail(`${label} failed: ${res.status} ${res.body}`);
}

export function scenarioSummary(name, data, extra = {}) {
  return {
    [`reports/${name}.json`]: JSON.stringify({ ...data, ...extra }, null, 2),
    [`reports/${name}.html`]: htmlReport(data),
  };
}
