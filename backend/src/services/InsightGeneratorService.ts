import { AdminService } from './AdminService';
import { FactorAnalysisService } from './FactorAnalysisService';
import { UserRepository } from '../repositories/UserRepository';

/**
 * Plain-language research insights built only from already-computed statistics.
 * This is not LLM output and not model explanation.
 */
export class InsightGeneratorService {
  constructor(
    private factorService: FactorAnalysisService,
    private adminService: AdminService
  ) {}

  async generateInsights(): Promise<string[]> {
    const insights: string[] = [];

    const [ageGroups, experienceBands, workModels] = await Promise.all([
      this.factorService.getDemographicBreakdown('ageGroup'),
      this.factorService.getDemographicBreakdown('experienceBand'),
      this.factorService.getDemographicBreakdown('workModel'),
    ]);

    const pushTopGroupInsight = (
      label: string,
      rows: Array<{ group: string; sampleSize: number; highRiskPct: number }>
    ) => {
      const top = rows
        .filter((row) => row.sampleSize >= 5 && typeof row.highRiskPct === 'number')
        .sort((a, b) => (b.highRiskPct ?? 0) - (a.highRiskPct ?? 0))[0];

      if (top) {
        insights.push(
          `The ${top.group} ${label} showed the highest observed high-risk proportion (${top.highRiskPct}%, n=${top.sampleSize}).`
        );
      }
    };

    pushTopGroupInsight('age group', ageGroups as any);
    pushTopGroupInsight('experience band', experienceBands as any);
    pushTopGroupInsight('work model group', workModels as any);

    const metrics = await this.adminService.getModelMetrics();
    const topFeatures = this.extractTopGlobalFeatures(metrics).slice(0, 5);
    for (const feature of topFeatures) {
      insights.push(
        `${feature} was among the most influential model features across recent training runs.`
      );
    }

    return insights;
  }

  private extractTopGlobalFeatures(metrics: any[]): string[] {
    const featureScores: Record<string, number> = {};

    for (const model of metrics ?? []) {
      for (const feature of model.globalFeatureImportance ?? []) {
        const score = Number(feature.meanAbsShap ?? 0);
        if (!feature.featureName) continue;
        featureScores[feature.featureName] = Math.max(featureScores[feature.featureName] ?? 0, score);
      }
    }

    return Object.entries(featureScores)
      .sort((a, b) => b[1] - a[1])
      .map(([feature]) => feature);
  }
}

export const createInsightGeneratorService = () =>
  new InsightGeneratorService(
    new FactorAnalysisService(),
    new AdminService(new UserRepository())
  );
