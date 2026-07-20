import PDFDocument from 'pdfkit';
import { WellnessReport } from '../models/WellnessReport';

const formatDate = (value: Date) =>
  value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatDateTime = (value: Date) =>
  value.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export class PdfService {
  async generateReportPdf(report: WellnessReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];

      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      document.fontSize(20).fillColor('#111827').text('BurnoutGuard Weekly Wellness Report');
      document.moveDown(0.5);
      document.fontSize(10).fillColor('#6B7280').text(`Report ID: ${report.reportId}`);
      document.text(`User ID: ${report.userId}`);
      document.text(`Generated: ${formatDateTime(report.createdDateTime)}`);

      document.moveDown(1);
      document.fontSize(14).fillColor('#111827').text('Report Summary');
      document.moveDown(0.5);

      const summaryRows: Array<[string, string]> = [
        ['Week Start', formatDate(new Date(report.weekStart))],
        ['Week End', formatDate(new Date(report.weekEnd))],
        ['Average Stress', `${report.avgStress.toFixed(2)} / 10`],
        ['Average Sleep', `${report.avgSleep.toFixed(2)} h`],
        ['Average Mood', `${report.avgMood.toFixed(2)} / 10`],
        ['Average Work Hours', `${report.avgWorkHours.toFixed(2)} h`],
        ['Total Check-Ins', String(report.totalCheckIns)],
        ['Exercise Days', String(report.exerciseDays)],
        ['Overall Trend', report.overallTrend],
        [
          'Risk Score at End of Week',
          report.riskScoreAtEndOfWeek === null
            ? 'N/A'
            : `${(report.riskScoreAtEndOfWeek * 100).toFixed(0)}%`,
        ],
        ['Created By', report.createdBy],
        ['Created Date', formatDateTime(new Date(report.createdDateTime))],
        ['Modified By', report.modifiedBy],
        ['Modified Date', formatDateTime(new Date(report.modifiedDate))],
      ];

      summaryRows.forEach(([label, value]) => {
        document.fontSize(11).fillColor('#111827').text(`${label}: `, { continued: true });
        document.fillColor('#374151').text(value);
      });

      if (report.insightSummary) {
        document.moveDown(1);
        document.fontSize(14).fillColor('#111827').text('Insight Summary');
        document.moveDown(0.5);
        document.fontSize(11).fillColor('#374151').text(report.insightSummary, {
          lineGap: 4,
        });
      }

      document.end();
    });
  }
}
