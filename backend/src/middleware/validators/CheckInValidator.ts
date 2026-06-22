import { z } from 'zod';

export const checkInSchema = z.object({
  workHours: z.number().min(0).max(24),
  stressLevel: z.number().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(5),
  exerciseDone: z.boolean(),
  screenTimeHours: z.number().min(0).max(24),
  workloadRating: z.number().min(1).max(5),
  moodScore: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(5),
  notes: z.string().max(500).optional(),
});

export type CheckInDto = z.infer<typeof checkInSchema>;
