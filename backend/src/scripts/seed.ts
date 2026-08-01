import { PrismaClient, RiskLevel, WorkModel, TrendDirection, AlertType, AlertSeverity } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ReportService } from '../services/ReportService';
import { ReportRepository } from '../repositories/ReportRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { UserRepository } from '../repositories/UserRepository';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed with historical dummy data...');

  const plainPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const usersToCreate = [
    { email: 'dev@burnoutguard.com', fullName: 'John Developer', role: 'Developer', company: 'TechCorp' },
    { email: 'manager@burnoutguard.com', fullName: 'Sarah Manager', role: 'Manager', company: 'TechCorp' },
    { email: 'hr@burnoutguard.com', fullName: 'Alice HR', role: 'HRofficer', company: 'TechCorp' },
    { email: 'admin@burnoutguard.com', fullName: 'Admin System', role: 'Admin', company: 'TechCorp' },
    { email: 'research@burnoutguard.com', fullName: 'Dr. Researcher', role: 'ResearchAdmin', company: 'University Lab' },
    // A few extra developers for Analytics Heatmap and Department stats
    { email: 'dev2@burnoutguard.com', fullName: 'Jane Dev2', role: 'Developer', company: 'TechCorp' },
    { email: 'dev3@burnoutguard.com', fullName: 'Bob Dev3', role: 'Developer', company: 'TechCorp' },
    { email: 'dev4@burnoutguard.com', fullName: 'Sam Dev4', role: 'Developer', company: 'TechCorp' },
    { email: 'dev5@burnoutguard.com', fullName: 'Eve Dev5', role: 'Developer', company: 'TechCorp' },
    { email: 'dev6@burnoutguard.com', fullName: 'Mike Dev6', role: 'Developer', company: 'OtherCorp' },
  ];

  const createdUsers = [];

  for (const u of usersToCreate) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        role: u.role as any,
        company: u.company,
        createdBy: 'system',
        modifiedBy: 'system',
      },
    });
    createdUsers.push(user);
    console.log(`Created/verified user: ${user.email} (${user.role})`);

    if (u.role === 'Developer') {
      await prisma.developerProfile.upsert({
        where: { userId: user.userId },
        update: {},
        create: {
          userId: user.userId,
          jobTitle: 'Software Engineer',
          yearsExperience: 3,
          workModel: WorkModel.Hybrid,
          createdBy: 'system',
          modifiedBy: 'system',
        },
      });
    }
  }

  // ── Seed alert thresholds ─────────────────────────────────────────
  console.log('Seeding alert thresholds...');
  const thresholdSeed = [
    {
      thresholdKey: 'worseningTrendThreshold',
      value: 0.05,
      description: 'Minimum risk-score increase required before sending a worsening alert.',
    },
    {
      thresholdKey: 'poorSleepHoursThreshold',
      value: 6,
      description: 'Sleep-hours threshold used when checking poor sleep patterns.',
    },
    {
      thresholdKey: 'poorSleepDaysWindow',
      value: 3,
      description: 'Consecutive days below the sleep threshold required to trigger a sleep alert.',
    },
  ];

  for (const threshold of thresholdSeed) {
    await (prisma as any).alertThreshold.upsert({
      where: { thresholdKey: threshold.thresholdKey },
      update: {
        value: threshold.value,
        description: threshold.description,
      },
      create: threshold,
    });
  }

  // Generate historical dummy predictions for all developers
  const developers = createdUsers.filter(u => u.role === 'Developer');
  
  for (const dev of developers) {
    const existingPredictions = await prisma.burnoutPrediction.count({ where: { userId: dev.userId }});
    if (existingPredictions > 0) continue; // Skip if already seeded

    // Generate 4 weeks of predictions per dev
    for (let i = 4; i >= 1; i--) {
      const isLatest = i === 1;
      const riskLevels: RiskLevel[] = [RiskLevel.Low, RiskLevel.Moderate, RiskLevel.High, RiskLevel.Critical];
      
      // Randomize somewhat based on their index to get a mix of data
      const riskIndex = (dev.email.length + i) % 4; 
      const riskLevel = riskLevels[riskIndex];
      const riskScore = riskIndex * 0.25 + 0.15; // 0.15 to 0.90

      const d = new Date();
      d.setDate(d.getDate() - (i * 7)); // 1 to 4 weeks ago

      const pred = await prisma.burnoutPrediction.create({
        data: {
          userId: dev.userId,
          riskScore,
          riskLevel,
          modelVersion: 'v1.1',
          checkInsUsed: 7,
          predictionDate: d,
          isLatest,
          trendDirection: TrendDirection.Stable,
          createdBy: 'system',
          modifiedBy: 'system',
        }
      });

      // If High/Critical, create an Alert for realism
      if (riskLevel === 'High' || riskLevel === 'Critical') {
        await prisma.alert.create({
          data: {
            userId: dev.userId,
            predictionId: pred.predictionId,
            alertType: AlertType.InApp,
            severity: riskLevel === 'Critical' ? AlertSeverity.Critical : AlertSeverity.Warning,
            message: `Mock Alert: Risk reached ${riskLevel} level.`,
            sentAt: d,
            isRead: !isLatest, // read older ones
            createdBy: 'system',
            modifiedBy: 'system'
          }
        });
      }
    }
  }

  // ── Generate historical check-ins for all developers ──────────────
  console.log('Generating historical check-in data...');
  for (const dev of developers) {
    // Generate historical check-ins per dev (1 per day for a week)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(10, 0, 0, 0);

      await prisma.dailyCheckIn.create({
        data: {
          userId: dev.userId,
          checkInDate: d,
          
          // Sleep & Rest
          sleepHours: 6 + Math.random() * 3, // 6-9 hours
          sleepQuality: Math.floor(Math.random() * 5) + 1, // 1-5
          
          // Physical Activity
          exerciseLevel: Math.floor(Math.random() * 5) + 1, // 1-5
          screenTimeHours: 4 + Math.random() * 6, // 4-10 hours
          
          // Work & Productivity
          workHours: 7 + Math.random() * 3, // 7-10 hours
          workloadRating: Math.floor(Math.random() * 5) + 1, // 1-5
          overtimeHours: Math.random() > 0.7 ? Math.random() * 4 : 0, // 30% have overtime
          breaksTaken: Math.floor(Math.random() * 6) + 1, // 1-6 breaks
          commuteMinutes: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
          
          // Mental & Emotional
          stressLevel: Math.floor(Math.random() * 8) + 2, // 2-10 scale
          moodScore: Math.floor(Math.random() * 7) + 3, // 3-10 scale
          energyLevel: Math.floor(Math.random() * 5) + 1, // 1-5
          workSatisfaction: Math.floor(Math.random() * 5) + 1, // 1-5
          
          // Lifestyle & Health
          caffeineIntake: Math.floor(Math.random() * 6) + 1, // 1-6 cups
          mealQuality: Math.floor(Math.random() * 5) + 1, // 1-5
          socialSupportLevel: Math.floor(Math.random() * 5) + 1, // 1-5

          // Psychological Wellbeing
          anxietyLevel: Math.floor(Math.random() * 6) + 2,      // 2-7
          emotionalFatigue: Math.floor(Math.random() * 6) + 2,  // 2-7
          motivationLevel: Math.floor(Math.random() * 5) + 1,   // 1-5
          concentrationIssues: Math.floor(Math.random() * 3) + 1, // 1-3
          irritabilityLevel: Math.floor(Math.random() * 3) + 1,   // 1-3
          lonelinessLevel: Math.floor(Math.random() * 3) + 1,     // 1-3
          selfEfficacy: Math.floor(Math.random() * 5) + 1,        // 1-5
          copingAbility: Math.floor(Math.random() * 5) + 1,       // 1-5

          // Work Context (Sri Lankan & Global)
          powerInternetDisruption: Math.floor(Math.random() * 3) + 1,   // 1-3
          wfhEnvironmentQuality: Math.floor(Math.random() * 5) + 1,     // 1-5
          familyResponsibilityLoad: Math.floor(Math.random() * 4) + 1,  // 1-4
          salaryWorkloadSatisfaction: Math.floor(Math.random() * 5) + 1,// 1-5
          afterHoursMessaging: Math.random() > 0.6,                     // ~40% true
          
          // Work Pattern Monitoring
          meetingsCount: Math.floor(Math.random() * 8),               // 0-7
          urgentTasksCount: Math.floor(Math.random() * 5),            // 0-4
          sprintPressureRating: Math.floor(Math.random() * 5) + 1,    // 1-5
          deadlineFrequency: Math.floor(Math.random() * 5) + 1,       // 1-5
          isWeekendWork: Math.random() > 0.8,                         // ~20% true
          bugFixingLoad: Math.floor(Math.random() * 5) + 1,           // 1-5
          contextSwitchingFrequency: Math.floor(Math.random() * 5) + 1, // 1-5
          isOnCallToday: Math.random() > 0.85,                        // ~15% true

          // Notes
          notes: Math.random() > 0.7 ? 'Had a productive day' : undefined,
          
          createdBy: 'system',
          modifiedBy: 'system',
        },
      });
    }
  }

  // ── Seed Wellness Resources ────────────────────────────────────────
  console.log('Seeding wellness resources...');
  const existingResources = await prisma.wellnessResource.count();
  if (existingResources === 0) {
    const resources = [
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
        description: 'A step-by-step guide to building a consistent pre-sleep routine that improves sleep quality — screen cutoffs, room temperature, and light exposure timing.',
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
        description: 'No-equipment stretches and movement routines designed for people who sit at a desk most of the day — can be done between meetings.',
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
        description: 'A beginner-friendly guided meditation for winding down after work. [Placeholder — audio playback not yet implemented; links to an external guided session.]',
        contentUrl: 'https://www.headspace.com/meditation/10-minute-meditation',
      },
      {
        title: 'Sri Lanka Sumithrayo — Confidential Emotional Support',
        category: 'Counseling',
        description: 'A free, confidential helpline offering emotional support for anyone experiencing distress, anxiety, or burnout-related difficulties.',
        contentUrl: 'https://www.sumithrayo.org/',
      },
    ];

    for (const r of resources) {
      await prisma.wellnessResource.create({
        data: {
          ...r,
          category: r.category as any,
          createdBy: 'system',
          modifiedBy: 'system',
        },
      });
    }
    console.log(`Seeded ${resources.length} wellness resources.`);
  } else {
    console.log('Wellness resources already seeded — skipping.');
  }
  
  console.log('Database seeding complete with dummy history and check-ins.');

  const reportService = new ReportService(
    new ReportRepository(),
    new CheckInRepository(),
    new UserRepository()
  );

  for (const dev of developers) {
    const report = await reportService.generateForRecentDays(dev.userId);
    if (report) {
      console.log(`Created/verified wellness report for ${dev.email} (${report.reportId})`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
