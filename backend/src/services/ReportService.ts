import { ReportRepository } from '../repositories/ReportRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { UserRepository } from '../repositories/UserRepository';
import { WellnessReport } from '../models/WellnessReport';
import prisma from '../config/db';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';
import { Env } from '../config/env';
import { EmailService } from './EmailService';

const auditLogService = new AuditLogService(new AuditLogRepository());

export class ReportService {
  constructor(
    private reportRepo: ReportRepository,
    private checkInRepo: CheckInRepository,
    private userRepo: UserRepository
  ) { }

  private async getActor(actorId: string) {
    const actor = await this.userRepo.findById(actorId);
    return {
      actorId,
      actorEmail: actor?.email ?? 'unknown',
      actorRole: actor?.role ?? 'Unknown',
    };
  }

  private async generateForWindow(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WellnessReport | null> {
    const checkIns = await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        checkInDate: { gte: weekStart, lte: weekEnd },
      },
    });

    if (checkIns.length === 0) {
      console.log(
        `[ReportService] Skipping user ${userId} — no check-ins found for report window.`
      );
      return null;
    }

    const avg = (arr: number[]) =>
      parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));

    const avgStress = avg(checkIns.map((c: any) => c.stressLevel));
    const avgSleep = avg(checkIns.map((c: any) => c.sleepHours));
    const avgMood = avg(checkIns.map((c: any) => c.moodScore));
    const avgWorkHours = avg(checkIns.map((c: any) => c.workHours));
    const exerciseDays = checkIns.filter((c: any) => c.exerciseLevel >= 3).length;
    const totalCheckIns = checkIns.length;

    const latestPrediction = await prisma.burnoutPrediction.findFirst({
      where: {
        userId,
        predictionDate: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { predictionDate: 'desc' },
    });

    const riskScoreAtEndOfWeek = latestPrediction?.riskScore ?? null;
    const riskLevel = latestPrediction?.riskLevel ?? 'Unknown';

    const prevReport = await this.reportRepo.findPreviousByWeekStart(userId, weekStart);

    let overallTrend = 'Stable';
    if (prevReport) {
      if (avgStress < prevReport.avgStress - 0.5) overallTrend = 'Improving';
      else if (avgStress > prevReport.avgStress + 0.5) overallTrend = 'Worsening';
    }

    const weekStartFormatted = weekStart.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const insightSummary =
      `Week of ${weekStartFormatted}: Average stress ${avgStress}/10, ` +
      `sleep ${avgSleep}h, mood ${avgMood}/10, work hours ${avgWorkHours}h/day. ` +
      `Burnout risk: ${riskLevel}. Trend: ${overallTrend}.`;

    const reportData = {
      userId,
      weekStart,
      weekEnd,
      avgStress,
      avgSleep,
      avgMood,
      avgWorkHours,
      totalCheckIns,
      exerciseDays,
      overallTrend,
      riskScoreAtEndOfWeek: riskScoreAtEndOfWeek ?? undefined,
      insightSummary,
      createdBy: userId,
      modifiedBy: userId,
    };

    const existingReport = await this.reportRepo.findByWeek(userId, weekStart);
    if (existingReport) {
      return this.reportRepo.update(existingReport.reportId, {
        ...reportData,
        modifiedDate: new Date(),
      } as any);
    }

    return this.reportRepo.create(reportData);
  }

  async generateForUser(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WellnessReport | null> {
    return this.generateForWindow(userId, weekStart, weekEnd);
  }

  async generateForRecentDays(
    userId: string,
    days = 7
  ): Promise<WellnessReport | null> {
    const weekEnd = new Date();
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - (days - 1));
    weekStart.setHours(0, 0, 0, 0);

    return this.generateForWindow(userId, weekStart, weekEnd);
  }

  async generateForAllUsers(actorId?: string): Promise<number> {
    const users = await prisma.user.findMany({ where: { isActive: true } });

    // Last week: Monday to Sunday
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 + 7;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToLastMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let count = 0;
    for (const user of users) {
      const report = await this.generateForUser((user as any).userId, weekStart, weekEnd);
      if (report) {
        count++;
        if ((user as any).emailNotificationsEnabled) {
          EmailService.sendWeeklyReportEmail(
            (user as any).email,
            (user as any).fullName,
            report,
            Env.FRONTEND_URL
          ).catch((err: any) => {
            console.error('[ReportService] Weekly report email failed (caught):', err.message);
          });
        }
      }
    }

    console.log(
      `[ReportService] Generated ${count} reports for week of ${weekStart.toDateString()}`
    );

    if (actorId) {
      const actor = await this.getActor(actorId);
      void auditLogService.log({
        ...actor,
        action: 'REPORT_GENERATE_MANUAL',
        entityType: 'WellnessReport',
        details: `Generated ${count} report(s)`,
        result: 'Success',
      }).catch((err) => {
        console.error('[AuditLog] Failed to queue manual report generation log:', err.message);
      });
    } else {
      void auditLogService.log({
        actorEmail: 'system',
        actorRole: 'System',
        action: 'REPORT_GENERATE_SCHEDULED',
        entityType: 'WellnessReport',
        details: `Generated ${count} report(s)`,
        result: 'Success',
      }).catch((err) => {
        console.error('[AuditLog] Failed to queue scheduled report generation log:', err.message);
      });
    }

    return count;
  }

  async getAll(userId: string): Promise<WellnessReport[]> {
    return this.reportRepo.findAllByUser(userId);
  }

  async getById(
    reportId: string,
    userId: string
  ): Promise<WellnessReport | null> {
    return this.reportRepo.findById(reportId, userId);
  }
}
