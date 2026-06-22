import cron from 'node-cron';
import { ReportService } from '../services/ReportService';

export function startWeeklyReportJob(reportService: ReportService): void {
  // Every Sunday at 23:59
  cron.schedule('59 23 * * 0', async () => {
    console.log('[WeeklyReportJob] Starting weekly wellness report generation...');
    try {
      const count = await reportService.generateForAllUsers();
      console.log(`[WeeklyReportJob] Weekly report job completed. Generated ${count} reports.`);
    } catch (err) {
      console.error('[WeeklyReportJob] Error during report generation:', err);
    }
  });

  console.log('[WeeklyReportJob] Scheduled: every Sunday at 23:59');
}
