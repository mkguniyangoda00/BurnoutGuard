import prisma from '../config/db';

export const ALERT_THRESHOLD_DEFAULTS: Record<string, { value: number; description: string }> = {
  worseningTrendThreshold: {
    value: 0.05,
    description: 'Minimum risk-score increase required before sending a worsening alert.',
  },
  poorSleepHoursThreshold: {
    value: 6,
    description: 'Sleep-hours threshold used when checking poor sleep patterns.',
  },
  poorSleepDaysWindow: {
    value: 3,
    description: 'Consecutive days below the sleep threshold required to trigger a sleep alert.',
  },
};

export async function getAlertThresholdValue(thresholdKey: string, fallback: number): Promise<number> {
  try {
    const threshold = await (prisma as any).alertThreshold.findUnique({ where: { thresholdKey } });
    return threshold?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getAlertThresholdMap(): Promise<Record<string, { value: number; description: string }>> {
  try {
    const rows = await (prisma as any).alertThreshold.findMany({ orderBy: { thresholdKey: 'asc' } });
    const map = { ...ALERT_THRESHOLD_DEFAULTS };
    for (const row of rows ?? []) {
      map[row.thresholdKey] = { value: row.value, description: row.description };
    }
    return map;
  } catch {
    return ALERT_THRESHOLD_DEFAULTS;
  }
}