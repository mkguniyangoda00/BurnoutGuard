import prisma from '../config/db';

export class JournalRepository {
  async create(data: {
    userId: string;
    reflectionText: string;
    stressTriggers?: string;
    workChallenges?: string;
    positiveEvents?: string;
    copingStrategiesUsed?: string;
    createdBy: string;
    modifiedBy: string;
  }) {
    return prisma.journalEntry.create({ data });
  }

  async findByUserId(userId: string) {
    return prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' },
    });
  }

  async findById(entryId: string) {
    return prisma.journalEntry.findUnique({ where: { entryId } });
  }
}