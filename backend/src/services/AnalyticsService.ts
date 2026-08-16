import { PredictionRepository } from '../repositories/PredictionRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import prisma from '../config/db';

export class AnalyticsService {
  constructor(
    private predictionRepo: PredictionRepository,
    private checkInRepo: CheckInRepository
  ) {}

  async getTeamHeatmap(params?: {
  workMode?: string;
  riskPeriod?: string;
  experienceBand?: string;   
  jobTitle?: string;         
  }) {
    const { workMode, riskPeriod, experienceBand, jobTitle } = params ?? {};
    const cutoff = (() => {
      if (!riskPeriod || riskPeriod === 'All') return undefined;

      const now = new Date();
      const daysMap: Record<string, number> = {
        'Last 7 days': 7,
        'Last 30 days': 30,
        'Last 90 days': 90,
        'Last 6 months': 183,
        'Last 12 months': 365,
      };

      const days = daysMap[riskPeriod];
      if (days === undefined) return undefined;

      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    })();

    const developers = await prisma.user.findMany({
      where: {
        role: 'Developer',
        isActive: true,
        ...(workMode && workMode !== 'All'
          ? { developerProfile: { is: { workModel: workMode as any } } }
          : {}),
        ...(jobTitle && jobTitle !== 'All'
          ? { developerProfile: { is: { jobTitle } } }
          : {}),
      },
      include: { developerProfile: true },
      orderBy: { userId: 'asc' },
    });

    // Experience is a derived band (Junior/Senior), not a stored column, so it
    // has to be filtered in JS after the query rather than in the Prisma `where`.
    const filteredDevelopers = experienceBand && experienceBand !== 'All'
      ? developers.filter((dev: any) => {
          const years = dev.developerProfile?.yearsExperience ?? 0;
          return experienceBand === 'Junior (<3y)' ? years < 3 : years >= 3;
        })
      : developers;

    const members = [];
    let counter = 1;

    for (const dev of filteredDevelopers) {
      const predictions = await prisma.burnoutPrediction.findMany({
        where: {
          userId: dev.userId,
          ...(cutoff ? { predictionDate: { gte: cutoff } } : {}),
        },
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

  async getHeatmapFilterOptions() {
    const profiles = await prisma.developerProfile.findMany({
      where: { jobTitle: { not: null } },
      select: { jobTitle: true },
      distinct: ['jobTitle'],
    });
    return { jobTitles: profiles.map((p: any) => p.jobTitle).filter(Boolean) };
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

  /**
   * Aggregates work-pattern indicators (meetings, urgent tasks, overtime)
   * by company, identifying which teams show the heaviest workload
   * signals. Follows the exact same minimum-group-size-5 privacy filter
   * already used in getDepartmentOverview().
   */
  async getWorkloadHotspots() {
    const users = await prisma.user.findMany({ where: { isActive: true } });
    const companies = [...new Set(users.map((u: any) => u.company).filter(Boolean))];
    const result = [];

    for (const company of companies) {
      const companyUsers = users.filter((u: any) => u.company === company);
      if (companyUsers.length < 5) continue; // privacy: minimum group size

      const recentCheckIns = await prisma.dailyCheckIn.findMany({
        where: { userId: { in: companyUsers.map((u: any) => u.userId) } },
        orderBy: { checkInDate: 'desc' },
        take: companyUsers.length * 7, // roughly last week per user
      });

      const total = recentCheckIns.length;
      if (total === 0) continue;

      const avg = (key: string) =>
        recentCheckIns.reduce((sum: number, c: any) => sum + (c[key] ?? 0), 0) / total;

      result.push({
        department: company,
        avgMeetingsCount: parseFloat(avg('meetingsCount').toFixed(1)),
        avgUrgentTasksCount: parseFloat(avg('urgentTasksCount').toFixed(1)),
        avgOvertimeHours: parseFloat(avg('overtimeHours').toFixed(1)),
      });
    }

    // Sort by a simple combined workload score, highest first
    return result.sort(
      (a, b) =>
        b.avgMeetingsCount + b.avgUrgentTasksCount + b.avgOvertimeHours * 2 -
        (a.avgMeetingsCount + a.avgUrgentTasksCount + a.avgOvertimeHours * 2)
    );
  }

  async getFairnessReport() {
    const developers = await prisma.user.findMany({
      where: { role: 'Developer', isActive: true },
      include: { developerProfile: true, burnoutPredictions: { where: { isLatest: true }, take: 1 } },
    });

    const groupBy = (key: 'workModel' | 'experienceBand') => {
      const buckets: Record<
        string,
        { total: number; highRisk: number; scores: number[]; lowConfidenceHighRisk: number }
      > = {};

      for (const dev of developers as any[]) {
        const prediction = dev.burnoutPredictions[0];
        if (!prediction) continue;

        const groupValue = key === 'workModel'
          ? dev.developerProfile?.workModel ?? 'Unknown'
          : (dev.developerProfile?.yearsExperience ?? 0) < 3
          ? 'Junior (<3y)'
          : 'Senior (3y+)';

        if (!buckets[groupValue]) {
          buckets[groupValue] = { total: 0, highRisk: 0, scores: [], lowConfidenceHighRisk: 0 };
        }
        buckets[groupValue].total++;
        buckets[groupValue].scores.push(prediction.riskScore);

        const isHighRisk = prediction.riskLevel === 'High' || prediction.riskLevel === 'Critical';
        if (isHighRisk) {
          buckets[groupValue].highRisk++;
          // Proxy "borderline/low-confidence" flag: a High/Critical call whose
          // probability sits close to the decision boundary is more likely to
          // be a disparity-prone edge case than a confidently correct one.
          // This is a proxy for false-positive-prone predictions, NOT a
          // ground-truth false-negative rate — we have no clinically
          // labeled outcomes to compute true recall against.
          if (prediction.riskScore < 0.6) {
            buckets[groupValue].lowConfidenceHighRisk++;
          }
        }
      }

      return Object.entries(buckets)
        .filter(([, v]) => v.total >= 5) // privacy floor, same rule used elsewhere
        .map(([group, v]) => ({
          group,
          sampleSize: v.total,
          highRiskRate: parseFloat(((v.highRisk / v.total) * 100).toFixed(1)),
          avgRiskScore: parseFloat(
            (v.scores.reduce((a, b) => a + b, 0) / v.scores.length).toFixed(3)
          ),
          lowConfidenceHighRiskRate:
            v.highRisk > 0
              ? parseFloat(((v.lowConfidenceHighRisk / v.highRisk) * 100).toFixed(1))
              : 0,
        }));
    };

    const byWorkMode = groupBy('workModel');
    const byExperience = groupBy('experienceBand');

    const maxGap = (rows: { highRiskRate: number }[]) =>
      rows.length < 2 ? 0 : Math.max(...rows.map((r) => r.highRiskRate)) - Math.min(...rows.map((r) => r.highRiskRate));

    return {
      byWorkMode,
      byExperience,
      gaps: {
        workMode: parseFloat(maxGap(byWorkMode).toFixed(1)),
        experience: parseFloat(maxGap(byExperience).toFixed(1)),
      },
    };
  }
  /**
   * Time-series trend of average overtime hours per week, following the
   * same weekly-grouping pattern already used in getSprintRisk().
   */
  async getOvertimePatterns() {
    const checkIns = await prisma.dailyCheckIn.findMany({
      orderBy: { checkInDate: 'desc' },
      take: 200, // rough heuristic window, matching getSprintRisk()'s approach
    });

    const weeksMap: Record<string, { total: number; count: number }> = {};

    checkIns.forEach((c: any) => {
      const date = new Date(c.checkInDate);
      const weekString = `Week ${Math.ceil(date.getDate() / 7)} of ${date.toLocaleString('default', { month: 'short' })}`;

      if (!weeksMap[weekString]) {
        weeksMap[weekString] = { total: 0, count: 0 };
      }
      weeksMap[weekString].total += c.overtimeHours ?? 0;
      weeksMap[weekString].count++;
    });

    return Object.entries(weeksMap).map(([week, data]) => ({
      week,
      avgOvertimeHours: parseFloat((data.total / data.count).toFixed(2)),
    }));
  }

  /**
   * Surfaces the most common active recommendation categories among a
   * company's developers, without exposing individual identities.
   * Respects the same minimum-group-size-5 privacy rule used elsewhere
   * in this file.
   */
  async getManagerRecommendationSummary() {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: 'Developer' },
    });
    const companies = [...new Set(users.map((u: any) => u.company).filter(Boolean))];
    const result = [];

    for (const company of companies) {
      const companyUsers = users.filter((u: any) => u.company === company);
      if (companyUsers.length < 5) continue; // privacy: minimum group size

      const activeRecs = await prisma.recommendation.findMany({
        where: {
          userId: { in: companyUsers.map((u: any) => u.userId) },
          isCompleted: false,
          isDismissed: false,
        },
      });

      if (activeRecs.length === 0) continue;

      const categoryCounts: Record<string, number> = {};
      const usersPerCategory: Record<string, Set<string>> = {};

      activeRecs.forEach((r: any) => {
        categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
        if (!usersPerCategory[r.category]) usersPerCategory[r.category] = new Set();
        usersPerCategory[r.category].add(r.userId);
      });

      const categories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          activeCount: count,
          affectedUserCount: usersPerCategory[category].size,
        }))
        .sort((a, b) => b.activeCount - a.activeCount);

      result.push({
        department: company,
        teamSize: companyUsers.length,
        categories,
      });
    }

    return result;
  }
}
