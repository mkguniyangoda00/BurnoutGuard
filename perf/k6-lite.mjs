import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const [, , ...args] = process.argv;

function usage() {
  console.error('Usage: k6 run [--vus N] [--duration 10s] <script>');
  process.exit(1);
}

if (args[0] !== 'run') usage();

const scriptPath = args[args.length - 1];
if (!scriptPath || !scriptPath.endsWith('.js')) usage();

const scenarioName = path.basename(scriptPath);
const smokeDurationSeconds = 10;
const vus = 1;

const perfDir = path.dirname(path.resolve(scriptPath));
const rootDir = path.resolve(perfDir, '..');
const reportsDir = path.join(rootDir, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const config = await import(pathToFileURL(path.join(rootDir, 'config.js')).href);

const roles = {
  Developer: { email: 'dev@burnoutguard.com', password: 'Password123!' },
  Manager: { email: 'manager@burnoutguard.com', password: 'Password123!' },
  HRofficer: { email: 'hr@burnoutguard.com', password: 'Password123!' },
  Admin: { email: 'admin@burnoutguard.com', password: 'Password123!' },
  ResearchAdmin: { email: 'research@burnoutguard.com', password: 'Password123!' },
};

async function httpJson(url, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let text = '';
  try {
    text = await res.text();
  } catch {
    text = '';
  }
  return { status: res.status, body: text };
}

async function login(role = 'Developer') {
  const creds = roles[role];
  if (!creds) throw new Error(`Unknown role: ${role}`);
  const res = await httpJson(`${config.BASE_URL}/auth/login`, {
    method: 'POST',
    body: creds,
  });
  if (res.status !== 200) throw new Error(`Login failed for ${role}: ${res.status} ${res.body}`);
  const parsed = JSON.parse(res.body || '{}');
  return parsed.token || parsed.accessToken;
}

function buildCheckInPayload(iteration = 0) {
  const bump = iteration % 4;
  return {
    sleepHours: 6.5,
    sleepQuality: 3,
    exerciseLevel: 2 + (bump % 2),
    screenTimeHours: 6,
    workHours: 8 + (bump % 2),
    workloadRating: 3,
    overtimeHours: 1 + (bump % 2),
    breaksTaken: 3,
    commuteMinutes: 30,
    stressLevel: 5 + bump,
    moodScore: 6,
    energyLevel: 3,
    workSatisfaction: 3,
    caffeineIntake: 2,
    mealQuality: 3,
    socialSupportLevel: 3,
    anxietyLevel: 4,
    emotionalFatigue: 4,
    motivationLevel: 3,
    concentrationIssues: 2,
    irritabilityLevel: 2,
    lonelinessLevel: 2,
    selfEfficacy: 3,
    copingAbility: 3,
    powerInternetDisruption: 2,
    wfhEnvironmentQuality: 3,
    familyResponsibilityLoad: 2,
    salaryWorkloadSatisfaction: 3,
    afterHoursMessaging: bump % 2 === 0,
    meetingsCount: 4 + bump,
    urgentTasksCount: 2,
    sprintPressureRating: 3 + (bump % 2),
    deadlineFrequency: 3,
    isWeekendWork: false,
    bugFixingLoad: 3,
    contextSwitchingFrequency: 3,
    isOnCallToday: false,
    managerSupportLevel: 3,
    peerSupportLevel: 3,
    autonomyLevel: 3,
    roleAmbiguity: 2,
    taskComplexity: 3,
    interruptionsPerDay: 3,
    notes: 'k6 perf test payload',
  };
}

function buildMlFeaturePayload(iteration = 0) {
  return {
    sleepHours: 6.5,
    sleepQuality: 3,
    exerciseLevel: 2,
    screenTimeHours: 6,
    workHours: 8 + (iteration % 3),
    workloadRating: 3,
    overtimeHours: 1 + (iteration % 2),
    breaksTaken: 3,
    commuteMinutes: 30,
    stressLevel: 5 + (iteration % 2),
    moodScore: 6,
    energyLevel: 3,
    workSatisfaction: 3,
    caffeineIntake: 2,
    mealQuality: 3,
    socialSupportLevel: 3,
    anxietyLevel: 4,
    emotionalFatigue: 4,
    motivationLevel: 3,
    concentrationIssues: 2,
    irritabilityLevel: 2,
    lonelinessLevel: 2,
    selfEfficacy: 3,
    copingAbility: 3,
    powerInternetDisruption: 2,
    wfhEnvironmentQuality: 3,
    familyResponsibilityLoad: 2,
    salaryWorkloadSatisfaction: 3,
    afterHoursMessaging: false,
    meetingsCount: 4,
    urgentTasksCount: 2,
    sprintPressureRating: 3,
    deadlineFrequency: 3,
    isWeekendWork: false,
    bugFixingLoad: 3,
    contextSwitchingFrequency: 3,
    isOnCallToday: false,
    workModeEncoded: 1,
    managerSupportLevel: 3,
    peerSupportLevel: 3,
    autonomyLevel: 3,
    roleAmbiguity: 2,
    taskComplexity: 3,
    interruptionsPerDay: 3,
  };
}

async function runRequest(token, request, iteration) {
  if (request === 'latestPrediction') return httpJson(`${config.BASE_URL}/predictions/latest`, { token });
  if (request === 'checkInHistory') return httpJson(`${config.BASE_URL}/checkins/history`, { token });
  if (request === 'submitCheckIn') return httpJson(`${config.BASE_URL}/checkins`, { method: 'POST', token, body: buildCheckInPayload(iteration) });
  if (request === 'recommendations') return httpJson(`${config.BASE_URL}/recommendations`, { token });
  if (request === 'reports') return httpJson(`${config.BASE_URL}/reports`, { token });
  if (request === 'managerHeatmap') return httpJson(`${config.BASE_URL}/analytics/heatmap`, { token });
  return httpJson(`${config.BASE_URL}/research/factors/demographic?dimension=jobTitle`, { token });
}

async function smokeRun() {
  const tokens = {
    developer: await login('Developer'),
    manager: await login('Manager'),
    admin: await login('Admin'),
    researchAdmin: await login('ResearchAdmin'),
  };

  const endAt = Date.now() + smokeDurationSeconds * 1000;
  let iterations = 0;
  let failures = 0;

  while (Date.now() < endAt) {
    iterations += 1;
    try {
      if (scenarioName === 'ml-service-isolated.js') {
        const payload = buildMlFeaturePayload(iterations);
        const res = iterations % 2 === 0
          ? await httpJson(`${config.ML_BASE_URL}/predict`, { method: 'POST', body: { features: payload } })
          : await httpJson(`${config.ML_BASE_URL}/whatif`, { method: 'POST', body: { features: payload, modifications: { overtimeHours: 0, stressLevel: 1, meetingsCount: 2 } } });
        if (![200].includes(res.status)) throw new Error(`${res.status} ${res.body}`);
      } else if (scenarioName === 'spike-test.js') {
        const checkInRes = await httpJson(`${config.BASE_URL}/checkins`, { method: 'POST', token: tokens.developer, body: buildCheckInPayload(iterations) });
        if (![200, 201].includes(checkInRes.status)) throw new Error(`${checkInRes.status} ${checkInRes.body}`);
        const triggerRes = await httpJson(`${config.BASE_URL}/predictions/trigger`, { method: 'POST', token: tokens.developer });
        if (triggerRes.status < 200 || triggerRes.status >= 500) throw new Error(`${triggerRes.status} ${triggerRes.body}`);
      } else {
        const r = Math.random();
        const request = r < 0.30 ? 'latestPrediction'
          : r < 0.45 ? 'checkInHistory'
          : r < 0.55 ? 'submitCheckIn'
          : r < 0.70 ? 'recommendations'
          : r < 0.80 ? 'reports'
          : r < 0.90 ? 'managerHeatmap'
          : 'adminDemographic';
        const token = request === 'managerHeatmap' ? tokens.manager : request === 'adminDemographic' ? tokens.admin : tokens.developer;
        const res = await runRequest(token, request, iterations);
        if (![200, 201].includes(res.status)) throw new Error(`${res.status} ${res.body}`);
      }
    } catch (err) {
      failures += 1;
      console.error(`[${scenarioName}] smoke iteration failed: ${err.message}`);
    }
  }

  const summary = {
    scenario: scenarioName,
    vus,
    durationSeconds: smokeDurationSeconds,
    iterations,
    failures,
    baseUrl: config.BASE_URL,
    mlBaseUrl: config.ML_BASE_URL,
  };

  fs.writeFileSync(path.join(reportsDir, `${path.basename(scenarioName, '.js')}.json`), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(reportsDir, `${path.basename(scenarioName, '.js')}.html`), `<html><body><pre>${JSON.stringify(summary, null, 2)}</pre></body></html>`);
  console.log(JSON.stringify(summary, null, 2));
  if (failures > 0) process.exitCode = 1;
}

smokeRun();
