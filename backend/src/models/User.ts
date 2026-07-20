export const enum UserRole {
  Developer = 'Developer',
  Manager = 'Manager',
  HRofficer = 'HRofficer',
  Admin = 'Admin',
  ResearchAdmin = 'ResearchAdmin',
}

export interface User {
  userId: string;
  email: string;
  passwordHash: string | null;
  fullName: string;
  role: UserRole;
  company: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  googleId: string | null;
  emailNotificationsEnabled: boolean;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}
