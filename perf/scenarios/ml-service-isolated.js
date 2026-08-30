import { sleep } from 'k6';
import { buildMlFeaturePayload, mlPredict, mlWhatIf } from '../helpers/requests.js';
import { ensureOk, scenarioSummary } from './_shared.js';

export const options = {
  scenarios: {
    isolated: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 30 },
        { duration: '3m', target: 30 },
        { duration: '1m', target: 0 },
      ],
    },
  },
};

export default function () {
  const payload = buildMlFeaturePayload(__ITER);
  const res = __ITER % 2 === 0
    ? mlPredict(payload)
    : mlWhatIf(payload, {
        overtimeHours: 0,
        stressLevel: 1,
        meetingsCount: 2,
      });

  ensureOk(res, 'ml-service', [200]);
  sleep(1);
}

export function handleSummary(data) {
  return scenarioSummary('ml-service-isolated', data);
}
