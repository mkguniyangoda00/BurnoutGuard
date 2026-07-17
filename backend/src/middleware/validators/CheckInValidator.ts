import { z } from 'zod';

export const checkInSchema = z.object({
  // Sleep & Rest
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(5),

  // Physical Activity
  exerciseLevel: z.number().min(1).max(5), // 1=None, 5=Intense
  screenTimeHours: z.number().min(0).max(24),

  // Work & Productivity
  workHours: z.number().min(0).max(24),
  workloadRating: z.number().min(1).max(5),
  overtimeHours: z.number().min(0).max(24),
  breaksTaken: z.number().min(0).max(20),
  commuteMinutes: z.number().min(0).max(480), // max 8 hours

  // Mental & Emotional
  stressLevel: z.number().min(1).max(10),
  moodScore: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(5),
  workSatisfaction: z.number().min(1).max(5),

  // Lifestyle & Health
  caffeineIntake: z.number().min(0).max(10),
  mealQuality: z.number().min(1).max(5),
  socialSupportLevel: z.number().min(1).max(5),

  // Psychological Wellbeing
  anxietyLevel: z.number().min(1).max(10),
  emotionalFatigue: z.number().min(1).max(10),
  motivationLevel: z.number().min(1).max(5),
  concentrationIssues: z.number().min(1).max(5),
  irritabilityLevel: z.number().min(1).max(5),
  lonelinessLevel: z.number().min(1).max(5),
  selfEfficacy: z.number().min(1).max(5),
  copingAbility: z.number().min(1).max(5),

  // Work Context (Sri Lankan & Global)
  powerInternetDisruption: z.number().min(1).max(5),
  wfhEnvironmentQuality: z.number().min(1).max(5),
  familyResponsibilityLoad: z.number().min(1).max(5),
  salaryWorkloadSatisfaction: z.number().min(1).max(5),
  afterHoursMessaging: z.boolean(),

  // Notes
  notes: z.string().max(500).optional(),
});

export type CheckInDto = z.infer<typeof checkInSchema>;