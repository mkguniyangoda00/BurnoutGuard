import { z } from 'zod';

export const ROLES = ['Developer', 'Manager', 'HRofficer', 'Admin', 'ResearchAdmin'] as const;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  company: z.string().optional(),
  consentGiven: z.boolean(),
  researchParticipation: z.boolean().optional(),
}).strict();

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(ROLES),
  company: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
