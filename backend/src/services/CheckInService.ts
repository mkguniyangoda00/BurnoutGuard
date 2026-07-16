import { CheckInRepository } from '../repositories/CheckInRepository';
import { MlService } from './MlService';
import { PredictionService } from './PredictionService';
import { CheckInDto } from '../middleware/validators/CheckInValidator';
import { CheckIn } from '../models/CheckIn';
import prisma from '../config/db';

export class CheckInService {
  constructor(
    private checkInRepo: CheckInRepository,
    private mlService: MlService,
    private predictionService?: PredictionService // optional to avoid circular deps at startup
  ) { }

  setPredictionService(service: PredictionService) {
    this.predictionService = service;
  }

  async submit(userId: string, dto: CheckInDto): Promise<CheckIn> {
    const existing = await this.checkInRepo.findTodayByUser(userId);
    if (existing) {
      const err: any = new Error('You have already submitted a check-in today');
      err.statusCode = 400;
      throw err;
    }

    const checkIn = await this.checkInRepo.create({
      userId,
      checkInDate: new Date(),
      ...dto,
    });

    const total = await this.checkInRepo.countByUser(userId);
    const streak = await this.checkInRepo.getCurrentStreak(userId);

    await prisma.developerProfile.updateMany({
      where: { userId },
      data: { totalCheckIns: total, currentStreak: streak },
    });

    if (total >= 7 && this.predictionService) {
      // Run async so check-in response is not delayed
      this.predictionService.createPrediction(userId).catch((err) => {
        console.error(
          `[CheckInService] Failed to create prediction for user ${userId}:`,
          err.message
        );
      });
    }

    return checkIn;
  }
  // Auto-trigger prediction generation if predictionService is injected
  async getHistory(userId: string): Promise<CheckIn[]> {
    return this.checkInRepo.findByUserId(userId);
  }

  async getStreak(userId: string): Promise<number> {
    return this.checkInRepo.getCurrentStreak(userId);
  }

  async editToday(userId: string, checkInId: string, dto: CheckInDto): Promise<CheckIn> {
    const checkIn = await this.checkInRepo.findById(checkInId);
    if (!checkIn) {
      const err: any = new Error('Check-in not found');
      err.statusCode = 404;
      throw err;
    }

    if (checkIn.userId !== userId) {
      const err: any = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }

    const checkInDay = new Date(checkIn.checkInDate);
    checkInDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDay.getTime() !== today.getTime()) {
      const err: any = new Error("You can only edit today's check-in");
      err.statusCode = 400;
      throw err;
    }

    return this.checkInRepo.update(checkInId, dto, userId);
  }
}
