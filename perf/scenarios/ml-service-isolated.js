import { sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { buildMlFeaturePayload } from '../helpers/requests.js';
import { mlPredict, mlWhatIf } from '../helpers/requests.js';

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
  if (__ITER % 2 === 0) {
    mlPredict(payload);
  } else {
    mlWhatIf(payload, { overtimeHours: 0, meetingsCount: -2 });
  }
  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/ml-service-isolated.json': JSON.stringify(data, null, 2),
    'reports/ml-service-isolated.html': htmlReport(data),
  };
}
