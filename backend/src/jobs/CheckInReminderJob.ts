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