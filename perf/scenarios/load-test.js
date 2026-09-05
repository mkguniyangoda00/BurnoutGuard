import { sleep } from 'k6';
import { sharedThresholds } from '../config.js';
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
import { ensureOk, makeTokens, pickWeightedRequest, scenarioSummary } from './_shared.js';

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

export function setup() {
  return { tokens: makeTokens() };
}

export default function (data) {
  const { tokens } = data;
  const request = pickWeightedRequest(Math.random());
  const iteration = __ITER;

  if (request === 'latestPrediction') ensureOk(latestPrediction(tokens.developer), request);
  else if (request === 'checkInHistory') ensureOk(checkInHistory(tokens.developer), request);
  else if (request === 'submitCheckIn') ensureOk(submitCheckIn(tokens.developer, buildCheckInPayload(iteration)), request);
  else if (request === 'recommendations') ensureOk(recommendations(tokens.developer), request);
  else if (request === 'reports') ensureOk(reports(tokens.developer), request);
  else if (request === 'managerHeatmap') ensureOk(managerHeatmap(tokens.manager), request);
  else ensureOk(adminDemographic(tokens.admin), request);

  sleep(1);
}

export function handleSummary(data) {
  return scenarioSummary('load-test', data);
}
