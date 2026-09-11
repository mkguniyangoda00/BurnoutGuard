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

/**
 * Alert thresholds are admin-configured but change rarely, yet
 * getAlertThresholdValue was being called with a fresh DB round trip on
 * every single prediction creation — i.e. on every check-in submission,
 * one of the hottest write paths under load. A short TTL cache collapses
 * that into one query per cache window instead of one per request, cutting
 * a DB round trip (and the connection hold time that comes with it) off
 * the synchronous check-in -> prediction critical path, while still
 * picking up admin threshold changes within a few seconds.
 */
const THRESHOLD_CACHE_TTL_MS = 30_000;
const thresholdCache = new Map<string, { value: number; expiresAt: number }>();

export async function getAlertThresholdValue(thresholdKey: string, fallback: number): Promise<number> {
  const cached = thresholdCache.get(thresholdKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const threshold = await (prisma as any).alertThreshold.findUnique({ where: { thresholdKey } });
    const value = threshold?.value ?? fallback;
    thresholdCache.set(thresholdKey, { value, expiresAt: Date.now() + THRESHOLD_CACHE_TTL_MS });
    return value;
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