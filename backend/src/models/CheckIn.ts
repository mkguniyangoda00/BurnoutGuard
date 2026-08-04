export interface CheckIn {
  checkInId: string;
  userId: string;
  checkInDate: Date;

  // Sleep & Rest
  sleepHours: number;
  sleepQuality: number;

  // Physical Activity
  exerciseLevel: number;
  screenTimeHours: number;

  // Work & Productivity
  workHours: number;
  workloadRating: number;
  overtimeHours: number;
  breaksTaken: number;
  commuteMinutes: number;

  // Mental & Emotional
  stressLevel: number;
  moodScore: number;
  energyLevel: number;
  workSatisfaction: number;

  // Lifestyle & Health
  caffeineIntake: number;
  mealQuality: number;
  socialSupportLevel: number;

  // Psychological Wellbeing
  anxietyLevel: number;
  emotionalFatigue: number;
  motivationLevel: number;
  concentrationIssues: number;
  irritabilityLevel: number;
  lonelinessLevel: number;
  selfEfficacy: number;
  copingAbility: number;

  // Work Context (Sri Lankan & Global)
  powerInternetDisruption: number;
  wfhEnvironmentQuality: number;
  familyResponsibilityLoad: number;
  salaryWorkloadSatisfaction: number;
  afterHoursMessaging: boolean;

  // Work Pattern Monitoring
  meetingsCount: number;
  urgentTasksCount: number;
  sprintPressureRating: number;
  deadlineFrequency: number;
  isWeekendWork: boolean;
  bugFixingLoad: number;
  contextSwitchingFrequency: number;
  isOnCallToday: boolean;

  // Psychosocial / Work Design
  managerSupportLevel: number;
  peerSupportLevel: number;
  autonomyLevel: number;
  roleAmbiguity: number;
  taskComplexity: number;
  interruptionsPerDay: number;
  
  // Meta
  notes: string | null;
  isEdited: boolean;
  editedAt: Date | null;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}