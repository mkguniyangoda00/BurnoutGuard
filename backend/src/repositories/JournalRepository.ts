import prisma from '../config/db';
import { encryptText, decryptText } from '../utils/EncryptionUtils';

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
    const entry = await prisma.journalEntry.create({
      data: {
        ...data,
        reflectionText: encryptText(data.reflectionText)!,
        stressTriggers: encryptText(data.stressTriggers),
        workChallenges: encryptText(data.workChallenges),
        positiveEvents: encryptText(data.positiveEvents),
        copingStrategiesUsed: encryptText(data.copingStrategiesUsed),
      },
    });
    return this.decryptEntry(entry);
  }

  async findByUserId(userId: string) {
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' },
    });
    return entries.map((e: any) => this.decryptEntry(e));
  }

  async findById(entryId: string) {
    const entry = await prisma.journalEntry.findUnique({ where: { entryId } });
    return entry ? this.decryptEntry(entry) : null;
  }

  private decryptEntry(entry: any) {
    return {
      ...entry,
      reflectionText: decryptText(entry.reflectionText),
      stressTriggers: decryptText(entry.stressTriggers),
      workChallenges: decryptText(entry.workChallenges),
      positiveEvents: decryptText(entry.positiveEvents),
      copingStrategiesUsed: decryptText(entry.copingStrategiesUsed),
    };
  }
}