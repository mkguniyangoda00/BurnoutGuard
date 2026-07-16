import prisma from '../config/db';
import { WellnessReport } from '../models/WellnessReport';

export class ReportRepository {
  async create(data: {
    userId: string;
    weekStart: Date;
    weekEnd: Date;
    avgStress: number;
    avgSleep: number;
    avgMood: number;
    avgWorkHours: number;
    totalCheckIns: number;
    exerciseDays: number;
    overallTrend: string;
    riskScoreAtEndOfWeek?: number;
    insightSummary?: string;
    createdBy: string;
    modifiedBy: string;
  }): Promise<WellnessReport> {
    return prisma.wellnessReport.create({ data: data as any }) as unknown as WellnessReport;
  }

  async update(reportId: string, data: Partial<WellnessReport>): Promise<WellnessReport> {
    return prisma.wellnessReport.update({
      where: { reportId },
      data: data as any,
    }) as unknown as WellnessReport;
  }

  async findAllByUser(userId: string): Promise<WellnessReport[]> {
    return prisma.wellnessReport.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
    }) as unknown as WellnessReport[];
  }

  async findById(reportId: string, userId: string): Promise<WellnessReport | null> {
    return prisma.wellnessReport.findFirst({
      where: { reportId, userId },
    }) as unknown as WellnessReport | null;
  }

  async findByWeek(userId: string, weekStart: Date): Promise<WellnessReport | null> {
    return prisma.wellnessReport.findFirst({
      where: { userId, weekStart },
    }) as unknown as WellnessReport | null;
  }
}
