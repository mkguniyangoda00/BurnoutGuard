import { AlertRepository } from '../repositories/AlertRepository';
import { Alert } from '../models/Alert';
import { RiskLevel, AlertType, AlertSeverity } from '@prisma/client';
import { EmailService } from './EmailService';
import { UserRepository } from '../repositories/UserRepository';
import { Env } from '../config/env';
import { getAlertThresholdValue, ALERT_THRESHOLD_DEFAULTS } from '../utils/AlertThresholds';

interface PredictionContext {
  predictionId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  previousRiskScore?: number | null;
  scoreChange?: number | null;
}

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
    const worseningThreshold = await getAlertThresholdValue(
      'worseningTrendThreshold',
      ALERT_THRESHOLD_DEFAULTS.worseningTrendThreshold.value
    );

    const isHighRisk = riskLevel === 'High' || riskLevel === 'Critical';
    const isWorsening = scoreChange !== undefined && scoreChange !== null && scoreChange > worseningThreshold;
    const isImproving = scoreChange !== undefined && scoreChange !== null && scoreChange < -worseningThreshold;

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

  async checkPoorSleepPattern(userId: string, recentCheckIns: { sleepHours: number }[]): Promise<Alert | null> {
    const sleepThreshold = await getAlertThresholdValue(
      'poorSleepHoursThreshold',
      ALERT_THRESHOLD_DEFAULTS.poorSleepHoursThreshold.value
    );
    const windowDays = Math.max(
      1,
      Math.round(
        await getAlertThresholdValue(
          'poorSleepDaysWindow',
          ALERT_THRESHOLD_DEFAULTS.poorSleepDaysWindow.value
        )
      )
    );

    const lastDays = recentCheckIns.slice(0, windowDays);
    if (lastDays.length < windowDays) return null;

    const allBelowThreshold = lastDays.every((c) => c.sleepHours < sleepThreshold);
    if (!allBelowThreshold) return null;

    console.log(`[AlertService] Poor sleep pattern detected for user ${userId} — creating alert.`);

    return this.alertRepo.create({
      userId,
      predictionId: null,
      alertType: AlertType.InApp,
      severity: AlertSeverity.Warning,
      message: `Your sleep has been under ${sleepThreshold} hours for ${windowDays}+ days in a row. Poor sleep is one of the strongest burnout risk drivers — consider prioritizing rest this week.`,
      sentAt: new Date(),
      createdBy: 'system',
      modifiedBy: 'system',
    });
  }
  
}