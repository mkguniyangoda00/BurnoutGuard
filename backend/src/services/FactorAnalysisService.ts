import prisma from '../config/db';
import { aggregateCheckIns, FEATURE_COLUMNS, FEATURE_LABELS } from '../utils/FeatureAggregator';
import { BurnoutPrediction, RiskLevel } from '@prisma/client';

type LatestSubject = {
  userId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  developerProfile: {
    ageGroup: string | null;
    yearsExperience: number | null;
    jobTitle: string | null;
    workModel: string | null;
  } | null;
  burnoutPredictions: BurnoutPrediction[];
};

type BucketStats = {
  sampleSize: number;
  avgRiskScore: number | null;
  highRiskPct: number | null;
};

/**
 * Plain statistical association on real prediction + check-in data.
 * This is not SHAP or model explanation.
 */
export class FactorAnalysisService {
  private async getLatestSubjects() {
    const users = await prisma.user.findMany({
      where: { role: 'Developer', isActive: true },
      include: {
        developerProfile: true,
        burnoutPredictions: { where: { isLatest: true }, take: 1, orderBy: { predictionDate: 'desc' } },
      },
    });

    return users
      .map((u: any) => ({
        userId: u.userId,
        riskScore: u.burnoutPredictions[0]?.riskScore,
        riskLevel: u.burnoutPredictions[0]?.riskLevel,
        developerProfile: u.developerProfile
          ? {
              ageGroup: u.developerProfile.ageGroup ?? null,
              yearsExperience: u.developerProfile.yearsExperience ?? null,
              jobTitle: u.developerProfile.jobTitle ?? null,
              workModel: u.developerProfile.workModel ?? null,
            }
          : null,
        burnoutPredictions: u.burnoutPredictions,
      }))
      .filter((u: any) => u.riskScore !== undefined && u.riskLevel);
  }

  private async getAveragesForSubjects(subjects: any[]) {
    const rows = [];

    for (const subject of subjects) {
      const checkIns = await prisma.dailyCheckIn.findMany({
        where: {
          userId: subject.userId,
          checkInDate: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { checkInDate: 'desc' },
      });

      const { features } = aggregateCheckIns(checkIns as any, subject.developerProfile?.workModel);
      rows.push({ ...subject, features });
    }

    return rows;
  }

  /**
   * Plain statistical association on real prediction + check-in data.
   * This groups developers by a demographic or profile dimension only.
   * It is not SHAP, feature importance, or model explanation.
   */
  async getDemographicBreakdown(
    dimension: 'ageGroup' | 'experienceBand' | 'jobTitle' | 'workModel'
  ) {
    const subjects = await this.getAveragesForSubjects(await this.getLatestSubjects());
    const groups: Record<string, { sampleSize: number; riskScores: number[]; riskCounts: Record<RiskLevel, number> }> = {};

    for (const subject of subjects) {
      const groupValue =
        dimension === 'ageGroup'
          ? subject.developerProfile?.ageGroup ?? 'Unknown'
          : dimension === 'experienceBand'
          ? (subject.developerProfile?.yearsExperience ?? 0) < 3
            ? 'Junior (<3y)'
            : 'Senior (3y+)'
          : dimension === 'jobTitle'
          ? subject.developerProfile?.jobTitle ?? 'Unknown'
          : subject.developerProfile?.workModel ?? 'Unknown';

      if (!groups[groupValue]) {
        groups[groupValue] = {
          sampleSize: 0,
          riskScores: [],
          riskCounts: { Low: 0, Moderate: 0, High: 0, Critical: 0 },
        };
      }

      groups[groupValue].sampleSize++;
      groups[groupValue].riskScores.push(subject.riskScore);
      groups[groupValue].riskCounts[subject.riskLevel as RiskLevel]++;
    }

    return Object.entries(groups)
      .filter(([, v]) => v.sampleSize >= 5)
      .map(([group, v]) => ({
        group,
        sampleSize: v.sampleSize,
        avgRiskScore: parseFloat((v.riskScores.reduce((a, b) => a + b, 0) / v.riskScores.length).toFixed(3)),
        riskLevelCounts: v.riskCounts,
        highRiskPct: parseFloat((((v.riskCounts.High + v.riskCounts.Critical) / v.sampleSize) * 100).toFixed(1)),
      }));
  }

  /**
   * Plain statistical association on real prediction + check-in data.
   * Buckets a real feature value and reports how risk varies by bucket.
   * This is not SHAP, feature importance, or model explanation.
   */
  async getFactorDistribution(factorName: string) {
    if (!FEATURE_COLUMNS.includes(factorName as any)) {
      const err: any = new Error('Invalid factor name');
      err.statusCode = 400;
      throw err;
    }

    const subjects = await this.getAveragesForSubjects(await this.getLatestSubjects());
    const rows = subjects
      .map((subject: any) => ({
        value: subject.features[factorName],
        riskScore: subject.riskScore,
        riskLevel: subject.riskLevel,
      }))
      .filter((r) => typeof r.value === 'number');

    const sorted = [...rows].sort((a, b) => a.value - b.value);
    const n = sorted.length;
    const bins = Array.from({ length: 5 }, (_, i) => {
      const start = Math.floor((i * n) / 5);
      const end = Math.floor(((i + 1) * n) / 5);
      const slice = sorted.slice(start, end);
      return {
        range: slice.length ? `${slice[0].value} - ${slice[slice.length - 1].value}` : 'No data',
        sampleSize: slice.length,
        avgRiskScore: slice.length ? parseFloat((slice.reduce((a, b) => a + b.riskScore, 0) / slice.length).toFixed(3)) : null,
        highRiskPct: slice.length
          ? parseFloat((slice.filter((r) => r.riskLevel === 'High' || r.riskLevel === 'Critical').length / slice.length * 100).toFixed(1))
          : null,
      };
    });

    const xs = rows.map((r) => r.value);
    const ys = rows.map((r) => r.riskScore);
    const pearsonCorrelation = this.pearson(xs, ys);

    return {
      factorName,
      factorLabel: FEATURE_LABELS[factorName as (typeof FEATURE_COLUMNS)[number]],
      pearsonCorrelation,
      bins,
    };
  }

  /**
   * Plain statistical association on real prediction + check-in data.
   * Builds a 3x3 cross-tab of two factors using tertiles, not model attribution.
   */
  async getInteractionAnalysis(factorA: string, factorB: string) {
    if (!FEATURE_COLUMNS.includes(factorA as any) || !FEATURE_COLUMNS.includes(factorB as any)) {
      const err: any = new Error('Invalid factor name');
      err.statusCode = 400;
      throw err;
    }

    const subjects = await this.getAveragesForSubjects(await this.getLatestSubjects());
    const rows = subjects
      .map((subject: any) => ({
        a: subject.features[factorA],
        b: subject.features[factorB],
        riskScore: subject.riskScore,
        riskLevel: subject.riskLevel,
      }))
      .filter((r) => typeof r.a === 'number' && typeof r.b === 'number');

    const binsA = this.tertileLabels(rows.map((r) => r.a));
    const binsB = this.tertileLabels(rows.map((r) => r.b));

    const grid = [];
    for (const binA of binsA) {
      for (const binB of binsB) {
        const slice = rows.filter((r) => binA.contains(r.a) && binB.contains(r.b));
        const sampleSize = slice.length;
        const common = {
          binA: binA.label,
          binB: binB.label,
          sampleSize,
          avgRiskScore:
            sampleSize >= 5 ? parseFloat((slice.reduce((a, b) => a + b.riskScore, 0) / sampleSize).toFixed(3)) : null,
          highRiskPct:
            sampleSize >= 5
              ? parseFloat(((slice.filter((r) => r.riskLevel === 'High' || r.riskLevel === 'Critical').length / sampleSize) * 100).toFixed(1))
              : null,
        };
        grid.push(common);
      }
    }

    return {
      factorA,
      factorALabel: FEATURE_LABELS[factorA as (typeof FEATURE_COLUMNS)[number]],
      factorB,
      factorBLabel: FEATURE_LABELS[factorB as (typeof FEATURE_COLUMNS)[number]],
      grid,
    };
  }

  async getAvailableFactors() {
    return FEATURE_COLUMNS.map((factor) => ({
      value: factor,
      label: FEATURE_LABELS[factor],
    }));
  }

  private pearson(xs: number[], ys: number[]) {
    if (!xs.length || xs.length !== ys.length) return null;
    const n = xs.length;
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const mx = mean(xs);
    const my = mean(ys);
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < n; i++) {
      const x = xs[i] - mx;
      const y = ys[i] - my;
      num += x * y;
      dx += x * x;
      dy += y * y;
    }
    return dx === 0 || dy === 0 ? null : parseFloat((num / Math.sqrt(dx * dy)).toFixed(4));
  }

  private tertileLabels(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const q1 = sorted[Math.floor(n / 3)] ?? 0;
    const q2 = sorted[Math.floor((2 * n) / 3)] ?? 0;
    return [
      {
        label: 'Low',
        contains: (v: number) => v <= q1,
      },
      {
        label: 'Medium',
        contains: (v: number) => v > q1 && v <= q2,
      },
      {
        label: 'High',
        contains: (v: number) => v > q2,
      },
    ];
  }
}
