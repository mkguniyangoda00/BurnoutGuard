import prisma from '../config/db';
import crypto from 'crypto';

export class ResearchService {
  /**
   * Exports anonymized check-in + prediction + SHAP data for research use.
   * Real userId/email/fullName are never included — each user is replaced
   * with a stable anonymized identifier (same hash across all their rows
   * within a single export, so trends per anonymous participant remain
   * analyzable, but never traceable back to a real identity).
   */
  async exportAnonymizedData(options: {
    from?: Date;
    to?: Date;
    includeShap: boolean;
  }): Promise<string> {
    const { from, to, includeShap } = options;

    const dateFilter: any = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;

    const predictions = await prisma.burnoutPrediction.findMany({
      where: from || to ? { predictionDate: dateFilter } : {},
      include: includeShap ? { shapExplanations: true } : undefined,
      orderBy: { predictionDate: 'desc' },
    });

    // Stable per-export anonymized ID per real userId
    const idMap = new Map<string, string>();
    const anonId = (realUserId: string) => {
      if (!idMap.has(realUserId)) {
        idMap.set(realUserId, 'P-' + crypto.randomBytes(4).toString('hex').toUpperCase());
      }
      return idMap.get(realUserId)!;
    };

    const rows: string[] = [];
    const headers = [
      'anonymizedParticipantId', 'predictionDate', 'riskScore', 'riskLevel',
      'modelVersion', 'checkInsUsed', 'trendDirection',
    ];
    if (includeShap) headers.push('topShapFeature', 'topShapValue', 'topShapDirection');
    rows.push(headers.join(','));

    for (const p of predictions as any[]) {
      const base = [
        anonId(p.userId),
        p.predictionDate.toISOString(),
        p.riskScore,
        p.riskLevel,
        p.modelVersion,
        p.checkInsUsed,
        p.trendDirection,
      ];

      if (includeShap) {
        const topShap = p.shapExplanations?.sort((a: any, b: any) => a.importanceRank - b.importanceRank)[0];
        base.push(
          topShap?.featureName ?? '',
          topShap?.shapValue ?? '',
          topShap?.direction ?? ''
        );
      }

      rows.push(base.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }

    return rows.join('\n');
  }
}