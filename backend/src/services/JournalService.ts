import { JournalRepository } from '../repositories/JournalRepository';

export class JournalService {
  constructor(private journalRepo: JournalRepository) {}

  async create(userId: string, dto: {
    reflectionText: string;
    stressTriggers?: string;
    workChallenges?: string;
    positiveEvents?: string;
    copingStrategiesUsed?: string;
  }) {
    return this.journalRepo.create({
      ...dto,
      userId,
      createdBy: userId,
      modifiedBy: userId,
    });
  }

  async getHistory(userId: string) {
    return this.journalRepo.findByUserId(userId);
  }

  async getById(entryId: string, userId: string) {
    const entry = await this.journalRepo.findById(entryId);
    if (!entry || entry.userId !== userId) {
      const err: any = new Error('Journal entry not found');
      err.statusCode = 404;
      throw err;
    }
    return entry;
  }
}