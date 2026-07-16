import { UserRepository } from '../repositories/UserRepository';
import prisma from '../config/db';
import { User } from '../models/User';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';

const auditLogService = new AuditLogService(new AuditLogRepository());

export class AdminService {
  constructor(private userRepo: UserRepository) {}

  async getAllUsers() {
    const users = await this.userRepo.findAll();
    return users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user as any;
      return userWithoutPassword;
    });
  }

  async updateRole(targetUserId: string, newRole: string, adminId: string) {
    if (targetUserId === adminId) {
      const err: any = new Error('Cannot change your own role');
      err.statusCode = 400;
      throw err;
    }
    const updated = await this.userRepo.updateRole(targetUserId, newRole);
    auditLogService.log({
      actorId: adminId,
      actorEmail: 'admin',
      actorRole: 'Admin',
      action: 'ROLE CHANGE',
      entityType: 'User',
      entityId: targetUserId,
      details: `Role changed to ${newRole}`,
      result: 'Success',
    });
    return updated;
  }

  async deactivateUser(targetUserId: string, adminId: string) {
    if (targetUserId === adminId) {
      const err: any = new Error('Cannot deactivate your own account');
      err.statusCode = 400;
      throw err;
    }
    const updated = await this.userRepo.updateStatus(targetUserId, false);
    auditLogService.log({
      actorId: adminId,
      actorEmail: 'admin',
      actorRole: 'Admin',
      action: 'DEACTIVATE',
      entityType: 'User',
      entityId: targetUserId,
      result: 'Success',
    });
    return updated;
  }

  async getModelMetrics() {
    return [
      {
        version: 'v1.0',
        algorithm: 'XGBoost',
        accuracy: '87.3%',
        f1Score: '0.851',
        auc: '0.912',
        status: 'Retired',
        trainedAt: '2026-03-01',
      },
      {
        version: 'v1.1',
        algorithm: 'XGBoost',
        accuracy: '89.7%',
        f1Score: '0.873',
        auc: '0.934',
        status: 'Active',
        trainedAt: '2026-03-20',
      },
      {
        version: 'v1.2',
        algorithm: 'LightGBM',
        accuracy: '88.1%',
        f1Score: '0.862',
        auc: '0.921',
        status: 'Testing',
        trainedAt: '2026-04-01',
      },
    ];
  }
}
