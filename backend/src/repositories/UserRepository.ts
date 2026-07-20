import prisma from '../config/db';
import { User } from '../models/User';

export class UserRepository {
  async create(data: {
    email: string;
    passwordHash?: string | null;
    fullName: string;
    role: string;
    company?: string;
    googleId?: string | null;
    createdBy: string;
    modifiedBy: string;
  }): Promise<User> {
    return prisma.user.create({
      data: { ...data, role: data.role as any },
    }) as unknown as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } }) as unknown as User | null;
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { userId: id } }) as unknown as User | null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } }) as unknown as User | null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { userId },
      data: { lastLoginAt: new Date(), modifiedBy: userId, modifiedDate: new Date() },
    });
  }

  async findAll(): Promise<User[]> {
    return prisma.user.findMany() as unknown as User[];
  }

  async updateStatus(userId: string, isActive: boolean): Promise<User> {
    return prisma.user.update({
      where: { userId },
      data: { isActive, modifiedBy: userId },
    }) as unknown as User;
  }

  async updateRole(userId: string, role: string): Promise<User> {
    return prisma.user.update({
      where: { userId },
      data: { role: role as any, modifiedBy: userId },
    }) as unknown as User;
  }

  async updateGoogleId(userId: string, googleId: string): Promise<User> {
    return prisma.user.update({
      where: { userId },
      data: { googleId, modifiedBy: userId },
    }) as unknown as User;
  }

  async updateEmailNotifications(userId: string, enabled: boolean): Promise<User> {
    return prisma.user.update({
      where: { userId },
      data: { emailNotificationsEnabled: enabled, modifiedBy: userId },
    }) as unknown as User;
  }
}
