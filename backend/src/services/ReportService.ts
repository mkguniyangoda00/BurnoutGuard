import { ReportRepository } from '../repositories/ReportRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { WellnessReport } from '../models/WellnessReport';
import prisma from '../config/Db';

export class ReportService {
  constructor(
    private reportRepo: ReportRepository,
    private checkInRepo: CheckInRepository
  ) {}

  async generateForUser(
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

    if (checkIns.length < 3) {
      console.log(`[ReportService] Skipping user ${userId} — only ${checkIns.length} check-ins this week`);
      return null;
    }

    const avg = (vals: number[]) =>
      vals.reduce((a, b) => a + b, 0) / vals.length;

    const avgStress = avg(checkIns.map((c) => c.stressLevel));
    const avgSleep = avg(checkIns.map((c) => c.sleepHours));
    const avgMood = avg(checkIns.map((c) => c.moodScore));
    const avgWorkHours = avg(checkIns.map((c) => c.workHours));
    const exerciseDays = checkIns.filter((c) => c.exerciseDone).length;
    const totalCheckIns = checkIns.length;

    // Get latest prediction risk score in this week
    const latestPrediction = await prisma.burnoutPrediction.findFirst({
      where: {
        userId,
        predictionDate: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { predictionDate: 'desc' },
    });
    const riskScoreAtEndOfWeek = latestPrediction?.riskScore ?? undefined;
    const riskLevel = latestPrediction?.riskLevel ?? 'Unknown';

    // Compare to previous week
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevReport = await this.reportRepo.findByWeek(userId, prevWeekStart);

    let overallTrend = 'Stable';
    if (prevReport) {
      if (avgStress - prevReport.avgStress < -0.5) overallTrend = 'Improving';
      else if (avgStress - prevReport.avgStress > 0.5) overallTrend = 'Worsening';
    }

    const weekLabel = weekStart.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const insightSummary =
      `Week of ${weekLabel}: Average stress ${avgStress.toFixed(1)}/10, ` +
      `sleep ${avgSleep.toFixed(1)}h, mood ${avgMood.toFixed(1)}/10, ` +
      `work hours ${avgWorkHours.toFixed(1)}h per day. ` +
      `Burnout risk: ${riskLevel}. Trend: ${overallTrend}.`;

    const existing = await this.reportRepo.findByWeek(userId, weekStart);
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
      riskScoreAtEndOfWeek,
      insightSummary,
      createdBy: userId,
      modifiedBy: userId,
    };

    if (existing) {
      return this.reportRepo.update(existing.reportId, reportData as any);
    }
    return this.reportRepo.create(reportData);
  }

  async generateForAllUsers(): Promise<number> {
    const users = await prisma.user.findMany({ where: { isActive: true } });

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const diffToMonday = (dayOfWeek + 6) % 7;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diffToMonday - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let count = 0;
    for (const user of users) {
      const report = await this.generateForUser(user.userId, weekStart, weekEnd);
      if (report) count++;
    }

    console.log(`[ReportService] Generated ${count} reports for week of ${weekStart.toDateString()}`);
    return count;
  }

  async getAll(userId: string): Promise<WellnessReport[]> {
    return this.reportRepo.findAllByUser(userId);
  }

  async getById(reportId: string, userId: string): Promise<WellnessReport | null> {
    return this.reportRepo.findById(reportId, userId);
  }
}
