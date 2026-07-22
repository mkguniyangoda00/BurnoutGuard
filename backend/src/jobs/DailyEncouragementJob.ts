import cron from 'node-cron';
import { UserRepository } from '../repositories/UserRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { EmailService } from '../services/EmailService';
import { Env } from '../config/env';

const SELF_CARE_TIPS = [
  "Taking a 5-minute walk between meetings can meaningfully lower stress hormones — try it before your next call.",
  "Try setting a hard stop time for work today, even 30 minutes earlier than usual. Your brain needs the recovery time.",
  "Hydration affects focus and mood more than most people realize — keep a water bottle at your desk today.",
  "A short breathing exercise (4 seconds in, 4 seconds hold, 4 seconds out) for 2 minutes can reset your nervous system during a stressful moment.",
  "Batching notifications and checking messages at set times, rather than constantly, can meaningfully reduce context-switching fatigue.",
  "If today felt heavy, consider ending it 15 minutes early to do something that isn't screen-related, even briefly.",
  "Good sleep hygiene starts hours before bed — try dimming screens after dinner tonight and notice how you feel tomorrow.",
  "Connecting with a colleague or friend for even a 10-minute non-work chat can meaningfully buffer daily stress.",
];

function getTipForToday(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return SELF_CARE_TIPS[dayOfYear % SELF_CARE_TIPS.length];
}

/**
 * Sends a daily self-care/encouragement email to developers who checked in
 * today AND whose latest risk is NOT High/Critical — those users already
 * get a more urgent risk alert from AlertService instead, so we avoid
 * sending a conflicting "here's a nice tip!" email on the same day.
 */
export function startDailyEncouragementJob(
  userRepo: UserRepository,
  checkInRepo: CheckInRepository,
  predictionRepo: PredictionRepository
): void {
  // Every day at 09:00 — separate from the 18:00 missed-check-in reminder
  cron.schedule('0 9 * * *', async () => {
    console.log('[DailyEncouragementJob] Starting daily encouragement sweep...');
    const tip = getTipForToday();

    try {
      const allUsers = await userRepo.findAll();
      const developers = allUsers.filter(
        (u: any) => u.role === 'Developer' && u.isActive && u.emailNotificationsEnabled
      );

      let sentCount = 0;

      for (const dev of developers) {
        const userId = (dev as any).userId;

        const todayCheckIn = await checkInRepo.findTodayByUser(userId);
        if (!todayCheckIn) continue; // only encourage users actively engaging today

        const latestPrediction = await predictionRepo.findLatestByUser(userId);
        if (latestPrediction && (latestPrediction.riskLevel === 'High' || latestPrediction.riskLevel === 'Critical')) {
          continue; // these users get a more urgent risk alert instead
        }

        EmailService.sendEncouragementEmail(
          (dev as any).email,
          (dev as any).fullName,
          tip,
          Env.FRONTEND_URL
        ).catch((err: any) => {
          console.error('[DailyEncouragementJob] Email send failed (caught):', err.message);
        });

        sentCount++;
      }

      console.log(`[DailyEncouragementJob] Sent ${sentCount} encouragement email(s).`);
    } catch (err) {
      console.error('[DailyEncouragementJob] Error during encouragement sweep:', err);
    }
  });

  console.log('[DailyEncouragementJob] Scheduled: every day at 09:00');
}