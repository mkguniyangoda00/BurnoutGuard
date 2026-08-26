import http from 'k6/http';
import { check, fail } from 'k6';
import { BASE_URL, defaultHeaders, roles } from '../config.js';

export function login(role = 'Developer') {
  const creds = roles[role];
  if (!creds) {
    fail(`Unknown role: ${role}`);
  }

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: creds.email, password: creds.password }),
    { headers: defaultHeaders }
  );

  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returned token': (r) => !!r.json('token'),
  }) || fail(`Login failed for ${role}: ${res.status} ${res.body}`);

  return res.json('token');
}
