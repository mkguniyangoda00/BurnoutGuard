import PDFDocument from 'pdfkit';
import { WellnessReport } from '../models/WellnessReport';

const COLORS = {
  text: '#111827',
  textMuted: '#6B7280',
  textSecondary: '#374151',
  border: '#E5E7EB',
  primary: '#2F5FE0',
  primaryLight: '#EEF2FD',
  success: '#1B8C6E',
  successLight: '#E5F5F0',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
};

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

const trendColor = (trend: string) =>
  trend === 'Worsening' ? COLORS.danger : trend === 'Improving' ? COLORS.success : COLORS.textMuted;

const trendBg = (trend: string) =>
  trend === 'Worsening' ? COLORS.dangerLight : trend === 'Improving' ? COLORS.successLight : '#F3F4F6';

const metricColor = (value: number, warnAt: number, dangerAt: number, inverse = false) => {
  const bad = inverse ? value < dangerAt : value > dangerAt;
  const warn = inverse ? value < warnAt : value > warnAt;
  if (bad) return COLORS.danger;
  if (warn) return COLORS.warning;
  return COLORS.success;
};

export class PdfService {
  async generateReportPdf(report: WellnessReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks: Buffer[] = [];
      const pageWidth = document.page.width;
      const marginX = 48;
      const contentWidth = pageWidth - marginX * 2;

      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      // Header band
      document.rect(0, 0, pageWidth, 110).fill(COLORS.primary);
      document
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#FFFFFF')
        .text('BurnoutGuard', marginX, 32);
      document
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLORS.primaryLight)
        .text('Weekly Wellness Report', marginX, 60);

      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#DCE4FA')
        .text(`Generated ${formatDateTime(report.createdDateTime)}`, marginX, 80);

      let y = 134;
      document.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted);
      document.text(`Report ID: ${report.reportId}`, marginX, y);
      document.text(`User ID: ${report.userId}`, marginX, y + 13);

      y += 44;

      // Week range + trend badge
      document
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor(COLORS.text)
        .text(`Week of ${formatDate(new Date(report.weekStart))} – ${formatDate(new Date(report.weekEnd))}`, marginX, y);

      const badgeLabel = report.overallTrend.toUpperCase();
      const badgeWidth = document.font('Helvetica-Bold').fontSize(9).widthOfString(badgeLabel) + 20;
      const badgeX = pageWidth - marginX - badgeWidth;
      document
        .roundedRect(badgeX, y - 3, badgeWidth, 20, 10)
        .fill(trendBg(report.overallTrend));
      document
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(trendColor(report.overallTrend))
        .text(badgeLabel, badgeX, y + 2, { width: badgeWidth, align: 'center' });

      y += 32;

      // Metric chips row
      const metrics: Array<{ label: string; value: string; color: string }> = [
        {
          label: 'Avg Stress / 10',
          value: report.avgStress.toFixed(1),
          color: metricColor(report.avgStress, 4, 7),
        },
        {
          label: 'Avg Sleep (h)',
          value: report.avgSleep.toFixed(1),
          color: metricColor(report.avgSleep, 7.5, 6, true),
        },
        {
          label: 'Avg Mood / 10',
          value: report.avgMood.toFixed(1),
          color: metricColor(report.avgMood, 7, 4, true),
        },
        {
          label: 'Avg Work Hours',
          value: report.avgWorkHours.toFixed(1),
          color: metricColor(report.avgWorkHours, 8.5, 9),
        },
      ];

      const gap = 10;
      const chipWidth = (contentWidth - gap * (metrics.length - 1)) / metrics.length;
      const chipHeight = 62;

      metrics.forEach((m, i) => {
        const x = marginX + i * (chipWidth + gap);
        document
          .roundedRect(x, y, chipWidth, chipHeight, 8)
          .fillAndStroke('#FAFAFB', COLORS.border);
        document
          .font('Helvetica-Bold')
          .fontSize(18)
          .fillColor(m.color)
          .text(m.value, x, y + 14, { width: chipWidth, align: 'center' });
        document
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(COLORS.textMuted)
          .text(m.label, x, y + 40, { width: chipWidth, align: 'center' });
      });

      y += chipHeight + 28;

      // Risk score panel
      // Note: riskScoreAtEndOfWeek is the model's confidence in whichever risk
      // level it predicted, not a severity score — see ReportService for why
      // it must never be relabeled as "Low/Moderate/High risk" on its own.
      const riskPanelHeight = 56;
      const hasRiskScore = report.riskScoreAtEndOfWeek !== null;
      const riskColor = hasRiskScore
        ? report.riskScoreAtEndOfWeek! < 0.4
          ? COLORS.success
          : report.riskScoreAtEndOfWeek! < 0.7
          ? COLORS.warning
          : COLORS.danger
        : COLORS.textMuted;
      const riskBg = hasRiskScore
        ? report.riskScoreAtEndOfWeek! < 0.4
          ? COLORS.successLight
          : report.riskScoreAtEndOfWeek! < 0.7
          ? COLORS.warningLight
          : COLORS.dangerLight
        : '#F3F4F6';

      document.roundedRect(marginX, y, contentWidth, riskPanelHeight, 8).fill(riskBg);
      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.textMuted)
        .text('Model Confidence in Predicted Burnout Risk', marginX + 16, y + 12);
      document
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(riskColor)
        .text(
          hasRiskScore ? `${(report.riskScoreAtEndOfWeek! * 100).toFixed(0)}%` : 'N/A',
          marginX + 16,
          y + 27
        );

      y += riskPanelHeight + 28;

      // Report summary table
      document.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.text).text('Report Summary', marginX, y);
      y += 20;

      const summaryRows: Array<[string, string]> = [
        ['Total Check-Ins', String(report.totalCheckIns)],
        ['Exercise Days', String(report.exerciseDays)],
        ['Created By', report.createdBy],
        ['Created Date', formatDateTime(new Date(report.createdDateTime))],
        ['Modified By', report.modifiedBy],
        ['Modified Date', formatDateTime(new Date(report.modifiedDate))],
      ];

      summaryRows.forEach(([label, value], i) => {
        const rowY = y + i * 18;
        if (i % 2 === 0) {
          document.rect(marginX, rowY - 3, contentWidth, 18).fill('#FAFAFB');
        }
        document.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted).text(label, marginX + 8, rowY);
        document
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(COLORS.textSecondary)
          .text(value, marginX, rowY, { width: contentWidth - 8, align: 'right' });
      });

      y += summaryRows.length * 18 + 24;

      if (report.insightSummary) {
        document.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.text).text('Insight Summary', marginX, y);
        y += 20;

        const insightColor = trendColor(report.overallTrend);
        const insightBg = trendBg(report.overallTrend);
        const textHeight = document
          .font('Helvetica')
          .fontSize(10.5)
          .heightOfString(report.insightSummary, { width: contentWidth - 32, lineGap: 4 });
        const boxHeight = textHeight + 28;

        document.roundedRect(marginX, y, contentWidth, boxHeight, 8).fillAndStroke(insightBg, COLORS.border);
        document
          .font('Helvetica')
          .fontSize(10.5)
          .fillColor(COLORS.textSecondary)
          .text(report.insightSummary, marginX + 16, y + 14, { width: contentWidth - 32, lineGap: 4 });

        y += boxHeight;
      }

      // Footer
      document
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.textMuted)
        .text('BurnoutGuard — Confidential wellness report generated automatically for this user.', marginX, document.page.height - 36, {
          width: contentWidth,
          align: 'center',
        });

      document.end();
    });
  }
}
