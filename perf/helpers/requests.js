import http from 'k6/http';
import { BASE_URL, ML_BASE_URL, defaultHeaders } from '../config.js';

function authHeaders(token, extra = {}) {
  return {
    ...defaultHeaders,
    ...extra,
    Authorization: `Bearer ${token}`,
  };
}

export function latestPrediction(token) {
  return http.get(`${BASE_URL}/predictions/latest`, { headers: authHeaders(token) });
}

export function checkInHistory(token) {
  return http.get(`${BASE_URL}/checkins/history`, { headers: authHeaders(token) });
}

export function submitCheckIn(token, payload) {
  return http.post(`${BASE_URL}/checkins`, JSON.stringify(payload), {
    headers: authHeaders(token),
  });
}

export function recommendations(token) {
  return http.get(`${BASE_URL}/recommendations`, { headers: authHeaders(token) });
}

export function reports(token) {
  return http.get(`${BASE_URL}/reports`, { headers: authHeaders(token) });
}

export function managerHeatmap(token) {
  return http.get(`${BASE_URL}/analytics/heatmap`, { headers: authHeaders(token) });
}

export function adminDemographic(token) {
  return http.get(`${BASE_URL}/research/factors/demographic?dimension=jobTitle`, {
    headers: authHeaders(token),
  });
}

export function triggerPrediction(token) {
  return http.post(`${BASE_URL}/predictions/trigger`, null, {
    headers: authHeaders(token),
  });
}

export function mlPredict(payload) {
  return http.post(`${ML_BASE_URL}/predict`, JSON.stringify({ features: payload }), {
    headers: defaultHeaders,
  });
}

export function mlWhatIf(payload, modifications) {
  return http.post(
    `${ML_BASE_URL}/whatif`,
    JSON.stringify({ features: payload, modifications }),
    { headers: defaultHeaders }
  );
}

export function buildCheckInPayload(iteration = 0) {
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

export function buildMlFeaturePayload(iteration = 0) {
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
