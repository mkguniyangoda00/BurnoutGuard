import { AlertRepository } from '../repositories/AlertRepository';
import { Alert } from '../models/Alert';
import { RiskLevel, AlertType, AlertSeverity } from '@prisma/client';

export class AlertService {
  constructor(private alertRepo: AlertRepository) {}

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

    return this.alertRepo.create({
      userId,
      predictionId,
      alertType: AlertType.InApp,
      severity,
      message,
      sentAt: new Date(),
      createdBy: 'system',
      modifiedBy: 'system',
    });
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
