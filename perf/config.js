export const BASE_URL = 'http://localhost:5000/api';
export const ML_BASE_URL = 'http://localhost:5001';

export const sharedThresholds = {
  http_req_duration: ['p(95)<800'],
  http_req_failed: ['rate<0.01'],
};

export const roles = {
  Developer: { email: 'dev@burnoutguard.com', password: 'Password123!' },
  Manager: { email: 'manager@burnoutguard.com', password: 'Password123!' },
  HRofficer: { email: 'hr@burnoutguard.com', password: 'Password123!' },
  Admin: { email: 'admin@burnoutguard.com', password: 'Password123!' },
  ResearchAdmin: { email: 'research@burnoutguard.com', password: 'Password123!' },
};

export const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
