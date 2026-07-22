import { AlertRepository } from '../repositories/AlertRepository';
import { Alert } from '../models/Alert';
import { RiskLevel, AlertType, AlertSeverity } from '@prisma/client';
import { EmailService } from './EmailService';
import { UserRepository } from '../repositories/UserRepository';
import { Env } from '../config/env';

interface PredictionContext {
  predictionId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  previousRiskScore?: number | null;
  scoreChange?: number | null;
}

// Matches the same 0.05 threshold PredictionService already uses to decide
// trendDirection ('Improving'/'Worsening'/'Stable') — kept consistent.
const WORSENING_THRESHOLD = 0.05;

export class AlertService {
  private userRepo: UserRepository;

  constructor(private alertRepo: AlertRepository) {
    this.userRepo = new UserRepository();
  }

  /**
   * Central decision point for whether a just-created prediction warrants
   * notifying the user. Covers:
   *  1. Absolute high risk (High/Critical level)
   *  2. Worsening trend — risk score increased meaningfully vs the user's
   *     last check-in, even if the level itself is still Low/Moderate
   *     (early warning, not just a reaction to an already-bad number)
   *  3. Meaningful improvement — positive reinforcement
   */
  async evaluateAndNotify(userId: string, prediction: PredictionContext): Promise<Alert | null> {
    const { riskLevel, riskScore, scoreChange } = prediction;

    const isHighRisk = riskLevel === 'High' || riskLevel === 'Critical';
    const isWorsening = scoreChange !== undefined && scoreChange !== null && scoreChange > WORSENING_THRESHOLD;
    const isImproving = scoreChange !== undefined && scoreChange !== null && scoreChange < -WORSENING_THRESHOLD;

    console.log(
      `[AlertService] Evaluating prediction ${prediction.predictionId} — ` +
      `level=${riskLevel}, score=${riskScore}, change=${scoreChange ?? 'n/a'}, ` +
      `highRisk=${isHighRisk}, worsening=${isWorsening}, improving=${isImproving}`
    );

    if (isHighRisk || isWorsening) {
      return this.sendRiskAlert(userId, prediction, isHighRisk, isWorsening);
    }

    if (isImproving) {
      return this.sendImprovementAlert(userId, prediction);
    }

    console.log(`[AlertService] No alert warranted for prediction ${prediction.predictionId}.`);
    return null;
  }

  private async sendRiskAlert(
    userId: string,
    prediction: PredictionContext,
    isHighRisk: boolean,
    isWorsening: boolean
  ): Promise<Alert> {
    const { predictionId, riskLevel, riskScore } = prediction;

    const severity = riskLevel === 'Critical' ? AlertSeverity.Critical : AlertSeverity.Warning;

    const message = isHighRisk
      ? `Your burnout risk has reached ${riskLevel} level. Please review your personalized recommendations.`
      : `Your burnout risk has increased since your last check-in (now ${(riskScore * 100).toFixed(0)}%). Consider reviewing your recommendations.`;

    console.log(`[AlertService] Creating risk alert for prediction ${predictionId}.`);

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

    await this.sendEmailSafely(userId, (user) =>
      EmailService.sendBurnoutAlertEmail(user.email, user.fullName, riskLevel, Env.FRONTEND_URL)
    );

    return alert;
  }

  private async sendImprovementAlert(userId: string, prediction: PredictionContext): Promise<Alert> {
    const { predictionId, riskScore } = prediction;

    console.log(`[AlertService] Creating improvement alert for prediction ${predictionId}.`);

    return this.alertRepo.create({
      userId,
      predictionId,
      alertType: AlertType.InApp,
      severity: AlertSeverity.Info,
      message: `Nice work — your burnout risk has improved to ${(riskScore * 100).toFixed(0)}%. Keep up your current habits!`,
      sentAt: new Date(),
      createdBy: 'system',
      modifiedBy: 'system',
    });
  }

  /**
   * Shared helper: looks up the user, checks their email preference, and
   * calls the provided send function — never throws, so a failed email
   * never breaks alert creation or the check-in flow around it.
   */
  private async sendEmailSafely(
    userId: string,
    sendFn: (user: { email: string; fullName: string }) => Promise<boolean>
  ): Promise<void> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        console.warn(`[AlertService] User ${userId} not found — skipping email.`);
        return;
      }
      if (!user.emailNotificationsEnabled) {
        console.log(`[AlertService] User ${userId} has email notifications disabled — skipping.`);
        return;
      }
      const sent = await sendFn(user);
      if (!sent) {
        console.warn(
          `[AlertService] Email send returned false for user ${userId} — ` +
          `most likely cause: EMAIL_HOST/EMAIL_USER/EMAIL_PASS are not set in backend/.env. See setup notes.`
        );
      }
    } catch (err: any) {
      console.error('[AlertService] Email notification error:', err.message);
    }
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