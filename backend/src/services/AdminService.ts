import { UserRepository } from '../repositories/UserRepository';
import prisma from '../config/db';
import { User } from '../models/User';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';
import { CreateUserDto, ROLES } from '../middleware/validators/AuthValidator';
import { hashPassword } from '../utils/HashUtils';

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

  async createUser(dto: CreateUserDto, adminId: string) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      const err: any = new Error('Email already in use');
      err.statusCode = 400;
      throw err;
    }

    const actor = await this.getActor(adminId);
    const passwordHash = await hashPassword(dto.password);
    const user = await this.userRepo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      company: dto.company,
      consentGivenAt: null,
      researchParticipation: false,
      createdBy: actor.actorEmail,
      modifiedBy: actor.actorEmail,
    });

    if (dto.role === 'Developer') {
      await prisma.developerProfile.create({
        data: {
          userId: (user as any).userId,
          createdBy: actor.actorEmail,
          modifiedBy: actor.actorEmail,
        },
      });
    }

    void auditLogService.log({
      ...actor,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: (user as any).userId,
      details: `Created ${dto.role} user ${dto.email}`,
      result: 'Success',
    }).catch((err) => {
      console.error('[AuditLog] Failed to queue admin user-create log:', err.message);
    });

    const { passwordHash: _ph, ...safeUser } = user as any;
    return safeUser;
  }

  async updateRole(targetUserId: string, newRole: string, adminId: string) {
    if (!(ROLES as readonly string[]).includes(newRole)) {
      const err: any = new Error('Invalid role');
      err.statusCode = 400;
      throw err;
    }
    if (targetUserId === adminId) {
      const err: any = new Error('Cannot change your own role');
      err.statusCode = 400;
      throw err;
    }
    const updated = await this.userRepo.updateRole(targetUserId, newRole);
    if (newRole === 'Developer') {
      const profile = await prisma.developerProfile.findUnique({ where: { userId: targetUserId } });
      if (!profile) {
        await prisma.developerProfile.create({
          data: { userId: targetUserId, createdBy: adminId, modifiedBy: adminId },
        });
      }
    }
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
      version: algo === metadata.algorithm ? metadata.version : `benchmark · ${metadata.trainedAt?.slice(0, 10)}`,
      algorithm: algo,
      accuracy: `${(m.accuracy * 100).toFixed(1)}%`,
      f1Score: m.f1Score.toFixed(3),
      auc: m.auc ? m.auc.toFixed(3) : 'N/A',
      status: algo === metadata.algorithm ? 'Active' : 'Benchmarked',
      trainedAt: metadata.trainedAt,
      globalFeatureImportance: metadata.globalFeatureImportance || [],
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
