import prisma from '../config/db';

export class AuditLogRepository {
  async create(data: {
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
    return prisma.auditLog.create({
      data: {
        ...data,
        result: data.result || 'Success',
      },
    });
  }

  async findAll(limit = 50) {
    return prisma.auditLog.findMany({
      orderBy: { createdDateTime: 'desc' },
      take: limit,
    });
  }

  async findByDateRange(from: Date, to: Date) {
    return prisma.auditLog.findMany({
      where: {
        createdDateTime: { gte: from, lte: to },
      },
      orderBy: { createdDateTime: 'desc' },
      take: 100,
    });
  }

  async findByActor(actorEmail: string) {
    return prisma.auditLog.findMany({
      where: { actorEmail },
      orderBy: { createdDateTime: 'desc' },
      take: 50,
    });
  }
}
