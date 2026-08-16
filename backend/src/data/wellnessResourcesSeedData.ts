import prisma from '../config/db';

export const DEFAULT_WELLNESS_RESOURCES = [
  {
    title: 'Understanding Burnout: Signs and Early Warning Signals',
    category: 'Article',
    description: 'A practical overview of how burnout develops, the three core dimensions (exhaustion, cynicism, reduced efficacy), and how to recognize it early in yourself.',
    contentUrl: 'https://www.who.int/standards/classifications/frequently-asked-questions/burn-out-an-occupational-phenomenon',
  },
  {
    title: 'Setting Boundaries With After-Hours Work Messages',
    category: 'Article',
    description: 'Concrete strategies for negotiating and maintaining boundaries around evening and weekend work communication, without damaging team relationships.',
    contentUrl: 'https://hbr.org/2021/03/how-to-stop-checking-your-phone',
  },
  {
    title: 'The 10:30 PM Wind-Down Routine',
    category: 'SleepHygiene',
    description: 'A step-by-step guide to building a consistent pre-sleep routine that improves sleep quality - screen cutoffs, room temperature, and light exposure timing.',
    contentUrl: 'https://www.sleepfoundation.org/sleep-hygiene',
  },
  {
    title: 'Fixing an Irregular Sleep Schedule',
    category: 'SleepHygiene',
    description: 'How to gradually shift an inconsistent sleep pattern back to a stable rhythm, especially useful after periods of heavy overtime or on-call work.',
    contentUrl: 'https://www.sleepfoundation.org/sleep-hygiene/sleep-schedule',
  },
  {
    title: '20-Minute Desk-Break Workouts for Developers',
    category: 'Exercise',
    description: 'No-equipment stretches and movement routines designed for people who sit at a desk most of the day - can be done between meetings.',
    contentUrl: 'https://www.nhs.uk/live-well/exercise/gym-free-workouts/',
  },
  {
    title: 'Walking Meetings: A Simple Habit Change',
    category: 'Exercise',
    description: 'How to convert routine 1:1s or status calls into walking meetings, and the measurable stress-reduction benefits of doing so.',
    contentUrl: 'https://www.health.harvard.edu/staying-healthy/is-a-walking-meeting-right-for-you',
  },
  {
    title: '4-7-8 Breathing for Acute Stress',
    category: 'Breathing',
    description: 'A simple, evidence-informed breathing technique you can use in under 2 minutes before a stressful meeting or after a difficult conversation.',
    contentUrl: 'https://www.healthline.com/health/4-7-8-breathing',
  },
  {
    title: 'Box Breathing for Sustained Focus',
    category: 'Breathing',
    description: 'A technique used by high-performance professionals to regulate the nervous system during prolonged periods of pressure or context-switching.',
    contentUrl: 'https://www.healthline.com/health/box-breathing',
  },
  {
    title: 'Guided 10-Minute Mindfulness Session',
    category: 'Meditation',
    description: 'A beginner-friendly guided meditation for winding down after work. [Placeholder - audio playback not yet implemented; links to an external guided session.]',
    contentUrl: 'https://www.headspace.com/meditation/10-minute-meditation',
  },
  {
    title: 'Sri Lanka Sumithrayo - Confidential Emotional Support',
    category: 'Counseling',
    description: 'A free, confidential helpline offering emotional support for anyone experiencing distress, anxiety, or burnout-related difficulties.',
    contentUrl: 'https://www.sumithrayo.org/',
  },
];

export async function ensureWellnessResourcesSeeded(): Promise<void> {
  try {
    const existingCount = await prisma.wellnessResource.count();
    if (existingCount > 0) {
      console.log(`[WellnessResourceSeeder] ${existingCount} resource(s) already present - skipping auto-seed.`);
      return;
    }

    console.log('[WellnessResourceSeeder] No wellness resources found - seeding defaults...');
    for (const resource of DEFAULT_WELLNESS_RESOURCES) {
      await prisma.wellnessResource.create({
        data: {
          ...resource,
          category: resource.category as any,
          createdBy: 'system',
          modifiedBy: 'system',
        },
      });
    }
    console.log(`[WellnessResourceSeeder] Seeded ${DEFAULT_WELLNESS_RESOURCES.length} default wellness resource(s).`);
  } catch (err: any) {
    console.error('[WellnessResourceSeeder] Failed to auto-seed wellness resources:', err.message);
  }
}
