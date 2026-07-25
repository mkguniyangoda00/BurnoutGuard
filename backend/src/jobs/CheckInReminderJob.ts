import cron from 'node-cron';
import { UserRepository } from '../repositories/UserRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { EmailService } from '../services/EmailService';
import { Env } from '../config/env';

/**
 * Sends a friendly in-app + email reminder to any active Developer who
 * hasn't submitted a check-in yet today. Runs daily via node-cron, the
 * same scheduling mechanism already used by WeeklyReportJob.ts.
 */
export function startCheckInReminderJob(
  userRepo: UserRepository,
  checkInRepo: CheckInRepository,
  alertRepo: AlertRepository
): void {
  // Every day at 18:00 (6 PM) server time
  cron.schedule('0 18 * * *', async () => {
    console.log('[CheckInReminderJob] Starting daily check-in reminder sweep...');
    try {
      const allUsers = await userRepo.findAll();
      const developers = allUsers.filter(
        (u: any) => u.role === 'Developer' && u.isActive
      );

      let remindersSent = 0;

      for (const dev of developers) {
        const userId = (dev as any).userId;
        const todayCheckIn = await checkInRepo.findTodayByUser(userId);
        if (todayCheckIn) continue; // already checked in today — skip

        await alertRepo.create({
          userId,
          predictionId: null,
          alertType: 'InApp',
          severity: 'Info',
          message: "Don't forget to log today's check-in to keep your burnout risk up to date.",
          sentAt: new Date(),
          createdBy: 'system',
          modifiedBy: 'system',
        });

        if ((dev as any).emailNotificationsEnabled) {
          EmailService.sendCheckInReminderEmail(
            (dev as any).email,
            (dev as any).fullName,
            Env.FRONTEND_URL
          ).catch((err: any) => {
            console.error('[CheckInReminderJob] Email send failed (caught):', err.message);
          });
        }

        remindersSent++;
      }

      console.log(`[CheckInReminderJob] Sent ${remindersSent} check-in reminder(s).`);
    } catch (err) {
      console.error('[CheckInReminderJob] Error during reminder sweep:', err);
    }
  });

  console.log('[CheckInReminderJob] Scheduled: every day at 18:00');
}

/**
 * Separate, gentler reminder for users who haven't checked in for 5+ days —
 * distinct in tone and timing from the daily "you missed today" reminder.
 * Runs at a different time (11:00) to avoid overlapping the 18:00 daily job.
 */
export function startReassessmentReminderJob(
  userRepo: UserRepository,
  checkInRepo: CheckInRepository,
  alertRepo: AlertRepository
): void {
  cron.schedule('0 11 * * *', async () => {
    console.log('[ReassessmentReminderJob] Starting re-assessment sweep...');
    try {
      const allUsers = await userRepo.findAll();
      const developers = allUsers.filter((u: any) => u.role === 'Developer' && u.isActive);

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      let sentCount = 0;

      for (const dev of developers) {
        const userId = (dev as any).userId;
        const recentCheckIns = await checkInRepo.findByUserId(userId, 1);
        const lastCheckIn = recentCheckIns[0];

        const isStale = !lastCheckIn || new Date((lastCheckIn as any).checkInDate) < fiveDaysAgo;
        if (!isStale) continue;

        await alertRepo.create({
          userId,
          predictionId: null,
          alertType: 'InApp',
          severity: 'Info',
          message: "We haven't seen a check-in from you in a while. No pressure — whenever you're ready, we're here to help you keep track of your wellbeing.",
          sentAt: new Date(),
          createdBy: 'system',
          modifiedBy: 'system',
        });

        if ((dev as any).emailNotificationsEnabled) {
          EmailService.sendEmail(
            (dev as any).email,
            "🌱 We haven't seen you in a while",
            `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0F1117 0%, #1E2236 100%); padding: 28px 32px; text-align: center;">
                  <h1 style="color: #fff; font-size: 24px; margin: 0;">Burnout<span style="color: #D97706;">Guard</span></h1>
                </div>
                <div style="padding: 32px;">
                  <p style="font-size: 16px; color: #3B3D47; margin-bottom: 16px;">Hi <strong>${(dev as any).fullName}</strong>,</p>
                  <p style="font-size: 14px; color: #3B3D47; margin-bottom: 24px;">
                    It's been a few days since your last check-in. Whenever things settle down,
                    we'd love for you to pick back up — even a short check-in helps us
                    give you a more accurate picture of your wellbeing.
                  </p>
                  <a href="${Env.FRONTEND_URL}/developer/check-in" style="display: inline-block; background: #2F5FE0; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
                    Resume Check-ins
                  </a>
                </div>
              </div>
            `
          ).catch((err: any) => {
            console.error('[ReassessmentReminderJob] Email send failed (caught):', err.message);
          });
        }

        sentCount++;
      }

      console.log(`[ReassessmentReminderJob] Sent ${sentCount} re-assessment reminder(s).`);
    } catch (err) {
      console.error('[ReassessmentReminderJob] Error during re-assessment sweep:', err);
    }
  });

  console.log('[ReassessmentReminderJob] Scheduled: every day at 11:00');
}