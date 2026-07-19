import { CheckInRepository } from '../repositories/CheckInRepository';
import { UserRepository } from '../repositories/UserRepository';
import { MlService } from './MlService';
import { PredictionService } from './PredictionService';
import { CheckInDto } from '../middleware/validators/CheckInValidator';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';

const auditLogService = new AuditLogService(new AuditLogRepository());

export class CheckInService {
  private predictionService?: PredictionService;

  constructor(
    private checkInRepo: CheckInRepository,
    private mlService: MlService,
    private userRepo: UserRepository
  ) {}

  private async getActor(userId: string) {
    const actor = await this.userRepo.findById(userId);
    return {
      actorId: userId,
      actorEmail: actor?.email ?? 'unknown',
      actorRole: actor?.role ?? 'Unknown',
    };
  }

  /**
   * Setter injection (rather than constructor injection) to avoid a
   * circular dependency: PredictionService needs CheckInRepository,
   * and CheckInService needs PredictionService. Wired together in
   * checkinRoutes.ts after both are constructed.
   */
  setPredictionService(predictionService: PredictionService) {
    this.predictionService = predictionService;
  }

  async submit(userId: string, dto: CheckInDto) {
    console.log(`[CheckInService] Saving check-in for user ${userId}.`);
    const checkIn = await this.checkInRepo.create({
      ...dto,
      userId,
      checkInDate: new Date(),
    });

    const actor = await this.getActor(userId);
    void auditLogService.log({
      ...actor,
      action: 'CHECK_IN_SUBMIT',
      entityType: 'CheckIn',
      entityId: (checkIn as any).checkInId,
      result: 'Success',
    }).catch((err) => {
      console.error('[AuditLog] Failed to queue check-in submit log:', err.message);
    });

    console.log(`[CheckInService] Check-in saved for user ${userId} with id ${(checkIn as any).checkInId ?? 'unknown'}.`);
    if (!this.predictionService) {
      console.error(
        '[CheckInService] predictionService not wired — check checkinRoutes.ts setup.'
      );
    } else {
      try {
        console.log(`[CheckInService] Triggering prediction for user ${userId}.`);
        await this.predictionService.createPrediction(userId);
        console.log(`[CheckInService] Prediction created successfully for user ${userId}.`);
      } catch (err) {
        // Don't fail the check-in submission if prediction generation fails —
        // the user's check-in should still save successfully either way.
        console.error(`[CheckInService] Prediction generation failed for user ${userId}:`, err);
      }
    }

    return checkIn;
  }

  async getHistory(userId: string, limit?: number) {
    return this.checkInRepo.findByUserId(userId, limit);
  }

  async getStreak(userId: string) {
    return this.checkInRepo.getCurrentStreak(userId);
  }

  async editToday(
    checkInId: string,
    userId: string,
    dto: Partial<CheckInDto>
  ) {
    return this.checkInRepo.update(checkInId, dto, userId);
  }
}