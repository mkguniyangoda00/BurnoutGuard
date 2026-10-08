import prisma from '../config/db';
import { CheckIn } from '../models/CheckIn';
import { CheckInDto } from '../middleware/validators/CheckInValidator';

export class CheckInRepository {
  async create(data: CheckInDto & {
    userId: string;
    checkInDate: Date;
  }): Promise<CheckIn> {
    return prisma.dailyCheckIn.create({
      data: {
        ...data,
        createdBy: data.userId,
        modifiedBy: data.userId,
      },
    }) as unknown as CheckIn;
  }

  async findByUserId(userId: string, limit?: number): Promise<CheckIn[]> {
    return prisma.dailyCheckIn.findMany({
      where: { userId },
      orderBy: { checkInDate: 'desc' },
      ...(limit ? { take: limit } : {}),
    }) as unknown as CheckIn[];
  }

  async findLastSeven(userId: string): Promise<CheckIn[]> {
    return prisma.dailyCheckIn.findMany({
      where: { userId },
      orderBy: { checkInDate: 'desc' },
      take: 7,
    }) as unknown as CheckIn[];
  }

  async findById(id: string): Promise<CheckIn | null> {
    return prisma.dailyCheckIn.findUnique({
      where: { checkInId: id },
    }) as unknown as CheckIn | null;
  }

  async findTodayByUser(userId: string): Promise<CheckIn | null> {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    return prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        checkInDate: { gte: start, lte: end },
      },
    }) as unknown as CheckIn | null;
  }

  async update(
    id: string,
    data: Partial<Omit<CheckIn, 'checkInId' | 'userId' | 'createdBy' | 'createdDateTime'>>,
    userId: string
  ): Promise<CheckIn> {
    return prisma.dailyCheckIn.update({
      where: { checkInId: id },
      data: {
        ...data,
        isEdited: true,
        editedAt: new Date(),
        modifiedBy: userId,
        modifiedDate: new Date(),
      },
    }) as unknown as CheckIn;
  }

  async countByUser(userId: string): Promise<number> {
    return prisma.dailyCheckIn.count({ where: { userId } });
  }

  async getCurrentStreak(userId: string): Promise<number> {
    const checkIns = await prisma.dailyCheckIn.findMany({
      where: { userId },
      orderBy: { checkInDate: 'desc' },
      select: { checkInDate: true },
    });

    if (checkIns.length === 0) return 0;

    // Multiple check-ins can exist for the same calendar day (edits,
    // re-submissions), which would desync the index-to-expected-day
    // comparison below if not collapsed to one entry per day first.
    const uniqueDayTimestamps = Array.from(
      new Set(
        checkIns.map((c: { checkInDate: Date }) => {
          const day = new Date(c.checkInDate);
          day.setHours(0, 0, 0, 0);
          return day.getTime();
        })
      )
    ).sort((a, b) => b - a);

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDayTimestamps.length; i++) {
      const expectedDay = new Date(today);
      expectedDay.setDate(today.getDate() - i);

      if (uniqueDayTimestamps[i] === expectedDay.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
