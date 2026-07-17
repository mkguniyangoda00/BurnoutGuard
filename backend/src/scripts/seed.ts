import { PrismaClient, RiskLevel, WorkModel, TrendDirection, AlertType, AlertSeverity } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
    // Generate 7 check-ins per dev (1 per day for a week)
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
          
          // Notes
          notes: Math.random() > 0.7 ? 'Had a productive day' : undefined,
          
          createdBy: 'system',
          modifiedBy: 'system',
        },
      });
    }
  }

  console.log('Database seeding complete with dummy history and check-ins.');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
