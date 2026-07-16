import { AuditLogRepository } from '../repositories/AuditLogRepository';

export class AuditLogService {
  constructor(private auditRepo: AuditLogRepository) {}

  async log(data: {
    actorId?: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId?: string;
    ipAddress?: string;
    result?: string;
    details?: string;
  }) {
    this.auditRepo.create(data).catch((err) => {
      console.error('[AuditLog] Failed to write log:', err.message);
    });
  }

  async getAll(limit = 50) {
    return this.auditRepo.findAll(limit);
  }

  async getByDateRange(from: Date, to: Date) {
    return this.auditRepo.findByDateRange(from, to);
  }
}
