import { AlertRepository } from '../repositories/AlertRepository';
import { Alert } from '../models/Alert';
import { RiskLevel, AlertType, AlertSeverity } from '@prisma/client';
import { EmailService } from './EmailService';
import { UserRepository } from '../repositories/UserRepository';
import { Env } from '../config/env';

export class AlertService {
  private userRepo: UserRepository;

  constructor(private alertRepo: AlertRepository) {
    this.userRepo = new UserRepository();
  }

  async createIfHighRisk(
    userId: string,
    predictionId: string,
    riskLevel: RiskLevel
  ): Promise<Alert | null> {
    console.log(
      `[AlertService] Evaluating alert for prediction ${predictionId} with risk level ${riskLevel}.`
    );
    if (riskLevel !== 'High' && riskLevel !== 'Critical') {
      console.log(`[AlertService] No alert created for prediction ${predictionId}.`);
      return null;
    }

    const severity = riskLevel === 'Critical' ? AlertSeverity.Critical : AlertSeverity.Warning;
    const message = `Your burnout risk has reached ${riskLevel} level. Please review your personalized recommendations immediately.`;

    console.log(`[AlertService] Creating alert for prediction ${predictionId}.`);

    const alert = await this.alertRepo.create({
      userId,
      predictionId,
      alertType: AlertType.InApp,
      severity,
      message,
      sentAt: new Date(),
      createdBy: 'system',
      modifiedBy: 'system',
    });

    // Fire-and-forget email notification (same resilience pattern as AuditLogService)
    try {
      const user = await this.userRepo.findById(userId);
      if (user && user.emailNotificationsEnabled) {
        EmailService.sendBurnoutAlertEmail(
          user.email,
          user.fullName,
          riskLevel,
          Env.FRONTEND_URL
        ).catch((err: any) => {
          console.error('[AlertService] Email send failed (caught):', err.message);
        });
      }
    } catch (err: any) {
      // Fire-and-forget: email failure must never break alert creation
      console.error('[AlertService] Email notification error:', err.message);
    }

    return alert;
  }

  async getUnread(userId: string): Promise<Alert[]> {
    return this.alertRepo.findUnreadByUser(userId);
  }

  async markRead(alertId: string, userId: string): Promise<Alert> {
    return this.alertRepo.markRead(alertId, userId);
  }

  async dismiss(alertId: string, userId: string): Promise<Alert> {
    return this.alertRepo.dismiss(alertId, userId);
  }
}
