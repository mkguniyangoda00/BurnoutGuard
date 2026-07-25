import cron from 'node-cron';
import prisma from '../config/db';
import { AlertRepository } from '../repositories/AlertRepository';
import { UserRepository } from '../repositories/UserRepository';
import { EmailService } from '../services/EmailService';
import { Env } from '../config/env';

/**
 * Runs daily, finds recommendations completed 3-5 days ago whose
 * effectiveness hasn't been recorded yet, and sends a gentle follow-up
 * asking whether the recommendation actually helped.
 */
export function startRecommendationFollowUpJob(
  alertRepo: AlertRepository,
  userRepo: UserRepository
): void {
  cron.schedule('0 10 * * *', async () => {
    console.log('[RecommendationFollowUpJob] Starting follow-up sweep...');
    try {
      const now = new Date();
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(now.getDate() - 5);
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);

      const candidates = await prisma.recommendation.findMany({
        where: {
          isCompleted: true,
          effectivenessScore: null,
          completedAt: { gte: fiveDaysAgo, lte: threeDaysAgo },
        },
      });

      let sentCount = 0;

      for (const rec of candidates as any[]) {
        await alertRepo.create({
          userId: rec.userId,
          predictionId: rec.predictionId,
          alertType: 'InApp',
          severity: 'Info',
          message: `Did "${rec.title}" help? Let us know how it's going.`,
          sentAt: new Date(),
          createdBy: 'system',
          modifiedBy: 'system',
        });

        const user = await userRepo.findById(rec.userId);
        if (user && (user as any).emailNotificationsEnabled) {
          EmailService.sendEmail(
            (user as any).email,
            '💬 Quick check-in about your recommendation',
            `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0F1117 0%, #1E2236 100%); padding: 28px 32px; text-align: center;">
                  <h1 style="color: #fff; font-size: 24px; margin: 0;">Burnout<span style="color: #D97706;">Guard</span></h1>
                </div>
                <div style="padding: 32px;">
                  <p style="font-size: 16px; color: #3B3D47; margin-bottom: 16px;">Hi <strong>${(user as any).fullName}</strong>,</p>
                  <p style="font-size: 14px; color: #3B3D47; margin-bottom: 24px;">
                    A few days ago you completed the recommendation "<strong>${rec.title}</strong>".
                    We'd love to know — did it help? Your feedback helps us tailor better
                    suggestions for you going forward.
                  </p>
                  <a href="${Env.FRONTEND_URL}/developer/recommendations" style="display: inline-block; background: #2F5FE0; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
                    Share Feedback
                  </a>
                </div>
              </div>
            `
          ).catch((err: any) => {
            console.error('[RecommendationFollowUpJob] Email send failed (caught):', err.message);
          });
        }

        sentCount++;
      }

      console.log(`[RecommendationFollowUpJob] Sent ${sentCount} follow-up(s).`);
    } catch (err) {
      console.error('[RecommendationFollowUpJob] Error during follow-up sweep:', err);
    }
  });

  console.log('[RecommendationFollowUpJob] Scheduled: every day at 10:00');
}