import { PrismaClient, RiskLevel, WorkModel, TrendDirection, AlertType, AlertSeverity } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ReportService } from '../services/ReportService';
import { ReportRepository } from '../repositories/ReportRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { UserRepository } from '../repositories/UserRepository';
import { DEFAULT_WELLNESS_RESOURCES } from '../data/wellnessResourcesSeedData';

const prisma = new PrismaClient();

const ageGroups = [
  'Under25',
  'Age25to29',
  'Age30to34',
  'Age35to39',
  'Age40Plus',
  'PreferNotToSay',
] as const;

const randomAgeGroup = () => ageGroups[Math.floor(Math.random() * ageGroups.length)];

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
          ageGroup: randomAgeGroup(),
          createdBy: 'system',
          modifiedBy: 'system',
        },
      });
    }
  }

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

  const developers = createdUsers.filter(u => u.role === 'Developer');

  for (const dev of developers) {
    const existingPredictions = await prisma.burnoutPrediction.count({ where: { userId: dev.userId } });
    if (existingPredictions > 0) continue;

    for (let i = 4; i >= 1; i--) {
      const isLatest = i === 1;
      const riskLevels: RiskLevel[] = [RiskLevel.Low, RiskLevel.Moderate, RiskLevel.High, RiskLevel.Critical];

      const riskIndex = (dev.email.length + i) % 4;
      const riskLevel = riskLevels[riskIndex];
      const riskScore = riskIndex * 0.25 + 0.15;

      const d = new Date();
      d.setDate(d.getDate() - (i * 7));

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

      if (riskLevel === 'High' || riskLevel === 'Critical') {
        await prisma.alert.create({
          data: {
            userId: dev.userId,
            predictionId: pred.predictionId,
            alertType: AlertType.InApp,
            severity: riskLevel === 'Critical' ? AlertSeverity.Critical : AlertSeverity.Warning,
            message: `Mock Alert: Risk reached ${riskLevel} level.`,
            sentAt: d,
            isRead: !isLatest,
            createdBy: 'system',
            modifiedBy: 'system'
          }
        });
      }
    }
  }

  console.log('Generating historical check-in data...');
  for (const dev of developers) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(10, 0, 0, 0);

      await prisma.dailyCheckIn.create({
        data: {
          userId: dev.userId,
          checkInDate: d,
          sleepHours: 6 + Math.random() * 3,
          sleepQuality: Math.floor(Math.random() * 5) + 1,
          exerciseLevel: Math.floor(Math.random() * 5) + 1,
          screenTimeHours: 4 + Math.random() * 6,
          workHours: 7 + Math.random() * 3,
          workloadRating: Math.floor(Math.random() * 5) + 1,
          overtimeHours: Math.random() > 0.7 ? Math.random() * 4 : 0,
          breaksTaken: Math.floor(Math.random() * 6) + 1,
          commuteMinutes: Math.floor(Math.random() * 60) + 15,
          stressLevel: Math.floor(Math.random() * 8) + 2,
          moodScore: Math.floor(Math.random() * 7) + 3,
          energyLevel: Math.floor(Math.random() * 5) + 1,
          workSatisfaction: Math.floor(Math.random() * 5) + 1,
          caffeineIntake: Math.floor(Math.random() * 6) + 1,
          mealQuality: Math.floor(Math.random() * 5) + 1,
          socialSupportLevel: Math.floor(Math.random() * 5) + 1,
          anxietyLevel: Math.floor(Math.random() * 6) + 2,
          emotionalFatigue: Math.floor(Math.random() * 6) + 2,
          motivationLevel: Math.floor(Math.random() * 5) + 1,
          concentrationIssues: Math.floor(Math.random() * 3) + 1,
          irritabilityLevel: Math.floor(Math.random() * 3) + 1,
          lonelinessLevel: Math.floor(Math.random() * 3) + 1,
          selfEfficacy: Math.floor(Math.random() * 5) + 1,
          copingAbility: Math.floor(Math.random() * 5) + 1,
          powerInternetDisruption: Math.floor(Math.random() * 3) + 1,
          wfhEnvironmentQuality: Math.floor(Math.random() * 5) + 1,
          familyResponsibilityLoad: Math.floor(Math.random() * 4) + 1,
          salaryWorkloadSatisfaction: Math.floor(Math.random() * 5) + 1,
          afterHoursMessaging: Math.random() > 0.6,
          meetingsCount: Math.floor(Math.random() * 8),
          urgentTasksCount: Math.floor(Math.random() * 5),
          sprintPressureRating: Math.floor(Math.random() * 5) + 1,
          deadlineFrequency: Math.floor(Math.random() * 5) + 1,
          isWeekendWork: Math.random() > 0.8,
          bugFixingLoad: Math.floor(Math.random() * 5) + 1,
          contextSwitchingFrequency: Math.floor(Math.random() * 5) + 1,
          isOnCallToday: Math.random() > 0.85,
          notes: Math.random() > 0.7 ? 'Had a productive day' : undefined,
          createdBy: 'system',
          modifiedBy: 'system',
        },
      });
    }
  }

  console.log('Seeding wellness resources...');
  const existingResources = await prisma.wellnessResource.count();
  if (existingResources === 0) {
    for (const r of DEFAULT_WELLNESS_RESOURCES) {
      await prisma.wellnessResource.create({
        data: {
          ...r,
          category: r.category as any,
          createdBy: 'system',
          modifiedBy: 'system',
        },
      });
    }
    console.log(`Seeded ${DEFAULT_WELLNESS_RESOURCES.length} wellness resources.`);
  } else {
    console.log('Wellness resources already seeded - skipping.');
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
