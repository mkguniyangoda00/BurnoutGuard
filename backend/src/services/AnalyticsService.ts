import { PredictionRepository } from '../repositories/PredictionRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import prisma from '../config/db';

export class AnalyticsService {
  constructor(
    private predictionRepo: PredictionRepository,
    private checkInRepo: CheckInRepository
  ) {}

  async getTeamHeatmap() {
    const developers = await prisma.user.findMany({
      where: { role: 'Developer', isActive: true },
      orderBy: { userId: 'asc' },
    });

    const members = [];
    let counter = 1;

    for (const dev of developers) {
      const predictions = await prisma.burnoutPrediction.findMany({
        where: { userId: dev.userId },
        orderBy: { predictionDate: 'desc' },
        take: 4,
      });

      members.push({
        label: `Dev ${counter.toString().padStart(2, '0')}`,
        weeks: predictions.map((p: any, i: any) => ({
          week: `Wk ${i + 1}`,
          riskLevel: p.riskLevel,
        })),
      });

      counter++;
    }

    return { members };
  }

  async getDepartmentOverview() {
    const users = await prisma.user.findMany({
      where: { isActive: true },
    });

    const companies = [...new Set(users.map((u: any) => u.company).filter(Boolean))];
    const result = [];

    for (const company of companies) {
      const companyUsers = users.filter((u: any) => u.company === company);
      if (companyUsers.length < 5) continue; // Only include groups with 5 or more members

      const latestPredictions = await prisma.burnoutPrediction.findMany({
        where: {
          userId: { in: companyUsers.map((u: any) => u.userId) },
          isLatest: true,
        },
      });

      const total = latestPredictions.length;
      if (total === 0) continue;

      const counts = {
        Low: 0,
        Moderate: 0,
        High: 0,
        Critical: 0,
      };

      latestPredictions.forEach((p: any) => {
        counts[p.riskLevel as keyof typeof counts]++;
      });

      result.push({
        department: company,
        lowPct: (counts.Low / total) * 100,
        moderatePct: (counts.Moderate / total) * 100,
        highPct: (counts.High / total) * 100,
      });
    }

    return result;
  }

  async getSprintRisk() {
    const predictions = await prisma.burnoutPrediction.findMany({
      orderBy: { predictionDate: 'desc' },
      take: 40, // rough heuristic for last 4 weeks across devs
    });

    // In a real scenario we'd group by actual calendar weeks.
    // For this dummy logic, we'll mock the weekly buckets based on recent predictions.
    const weeksMap: Record<string, any> = {};

    predictions.forEach((p: any) => {
      // Grouping roughly by week of year for demonstration
      const date = new Date(p.predictionDate);
      const weekString = `Week ${Math.ceil(date.getDate() / 7)} of ${date.toLocaleString('default', { month: 'short' })}`;
      
      if (!weeksMap[weekString]) {
        weeksMap[weekString] = { highCount: 0, moderateCount: 0, lowCount: 0 };
      }

      if (p.riskLevel === 'High' || p.riskLevel === 'Critical') weeksMap[weekString].highCount++;
      else if (p.riskLevel === 'Moderate') weeksMap[weekString].moderateCount++;
      else weeksMap[weekString].lowCount++;
    });

    return Object.entries(weeksMap).map(([week, counts]) => ({
      week,
      ...counts,
    }));
  }
}
