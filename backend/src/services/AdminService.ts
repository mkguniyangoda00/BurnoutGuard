import { UserRepository } from '../repositories/UserRepository';
import prisma from '../config/db';
import { User } from '../models/User';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';

const auditLogService = new AuditLogService(new AuditLogRepository());

export class AdminService {
  constructor(private userRepo: UserRepository) {}

  private async getActor(actorId: string) {
    const actor = await this.userRepo.findById(actorId);
    return {
      actorId,
      actorEmail: actor?.email ?? 'unknown',
      actorRole: actor?.role ?? 'Unknown',
    };
  }

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
    const actor = await this.getActor(adminId);
    void auditLogService.log({
      ...actor,
      action: 'ROLE CHANGE',
      entityType: 'User',
      entityId: targetUserId,
      details: `Role changed to ${newRole}`,
      result: 'Success',
    }).catch((err) => {
      console.error('[AuditLog] Failed to queue admin role-change log:', err.message);
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
    const actor = await this.getActor(adminId);
    void auditLogService.log({
      ...actor,
      action: 'DEACTIVATE',
      entityType: 'User',
      entityId: targetUserId,
      result: 'Success',
    }).catch((err) => {
      console.error('[AuditLog] Failed to queue admin deactivate log:', err.message);
    });
    return updated;
  }

  async getModelMetrics() {
  const fs = require('fs');
  const path = require('path');
  const metadataPath = path.join(__dirname, '../../../ml-service/models/metadata.json');

  try {
    const raw = fs.readFileSync(metadataPath, 'utf-8');
    const metadata = JSON.parse(raw);

    // metadata.metrics is keyed by algorithm name, e.g.
    // { LogisticRegression: {...}, RandomForest: {...}, XGBoost: {...} }
    const allModels = Object.entries(metadata.metrics || {}).map(([algo, m]: [string, any]) => ({
      version: metadata.version,
      algorithm: algo,
      accuracy: `${(m.accuracy * 100).toFixed(1)}%`,
      f1Score: m.f1Score.toFixed(3),
      auc: m.auc ? m.auc.toFixed(3) : 'N/A',
      status: algo === metadata.algorithm ? 'Active' : 'Benchmarked',
      trainedAt: metadata.trainedAt,
    }));

    return allModels;
  } catch (err: any) {
    console.error('[AdminService] Failed to read ml-service/models/metadata.json:', err.message);
    return [];
  }
}

async triggerRetrain() {
  const axios = require('axios');
  const { Env } = require('../config/env');

  const response = await axios.post(`${Env.ML_SERVICE_URL}/retrain`, {}, { timeout: 300000 });
  return response.data; // { success: boolean, log: string }
}

}
