import nodemailer from 'nodemailer';
import { Env } from '../config/env';
import { WellnessReport } from '../models/WellnessReport';

class EmailServiceClass {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    if (!Env.EMAIL_HOST || !Env.EMAIL_USER || !Env.EMAIL_PASS) {
      console.warn(
        '[EmailService] SMTP not configured — email notifications disabled. ' +
        'Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in backend/.env to enable them.'
      );
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: Env.EMAIL_HOST,
      port: Env.EMAIL_PORT,
      secure: Env.EMAIL_PORT === 465,
      requireTLS: Env.EMAIL_PORT === 587, // needed for STARTTLS providers like Gmail on 587
      auth: {
        user: Env.EMAIL_USER,
        pass: Env.EMAIL_PASS,
      },
    });

    return this.transporter;
  }

  /**
   * Call once at server startup to clearly log whether SMTP is actually
   * reachable, instead of only discovering this the first time an alert
   * silently fails to send.
   */
  async verifyConnection(): Promise<void> {
    const transport = this.getTransporter();
    if (!transport) return; // warning already logged in getTransporter()

    try {
      await transport.verify();
      console.log('[EmailService] SMTP connection verified — email notifications are ACTIVE.');
    } catch (err: any) {
      console.error(
        '[EmailService] SMTP verification FAILED — emails will NOT send. Check your credentials:',
        err.message
      );
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const transport = this.getTransporter();
    if (!transport) return false;

    try {
      await transport.sendMail({
        from: `"BurnoutGuard" <${Env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[EmailService] Email sent to ${to}: ${subject}`);
      return true;
    } catch (err: any) {
      console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
      return false;
    }
  }

  async sendBurnoutAlertEmail(
    to: string,
    fullName: string,
    riskLevel: string,
    frontendUrl: string
  ): Promise<boolean> {
    const riskColor = riskLevel === 'Critical' ? '#DC2626' : '#D97706';
    const subject = `⚠️ BurnoutGuard Alert: Your risk level is ${riskLevel}`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0F1117 0%, #1E2236 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0;">Burnout<span style="color: #D97706;">Guard</span></h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #3B3D47; margin-bottom: 16px;">Hi <strong>${fullName}</strong>,</p>
          <div style="background: white; border-radius: 10px; padding: 20px; border: 1px solid rgba(15,17,23,0.08); margin-bottom: 20px;">
            <p style="font-size: 14px; color: #7B7E8C; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Current Risk Level</p>
            <p style="font-size: 28px; font-weight: 700; color: ${riskColor}; margin: 0;">${riskLevel}</p>
          </div>
          <p style="font-size: 14px; color: #3B3D47; margin-bottom: 24px;">
            Your burnout risk has reached <strong style="color: ${riskColor};">${riskLevel}</strong> level.
            Please review your personalized recommendations and take proactive steps to manage your wellbeing.
          </p>
          <a href="${frontendUrl}/developer/my-risk" style="display: inline-block; background: #2F5FE0; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
            View My Risk Report
          </a>
          <p style="font-size: 12px; color: #7B7E8C; margin-top: 24px;">You can disable email notifications from your profile settings.</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendCheckInReminderEmail(
    to: string,
    fullName: string,
    frontendUrl: string
  ): Promise<boolean> {
    const subject = `👋 Don't forget your daily check-in`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0F1117 0%, #1E2236 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0;">Burnout<span style="color: #D97706;">Guard</span></h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #3B3D47; margin-bottom: 16px;">Hi <strong>${fullName}</strong>,</p>
          <p style="font-size: 14px; color: #3B3D47; margin-bottom: 24px;">
            We noticed you haven't logged today's check-in yet. It only takes about
            90 seconds and helps keep your burnout risk prediction accurate and up to date.
          </p>
          <a href="${frontendUrl}/developer/check-in" style="display: inline-block; background: #2F5FE0; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
            Submit Today's Check-in
          </a>
          <p style="font-size: 12px; color: #7B7E8C; margin-top: 24px;">You can disable these reminder emails from your profile settings.</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendEncouragementEmail(
    to: string,
    fullName: string,
    tip: string,
    frontendUrl: string
  ): Promise<boolean> {
    const subject = `🌿 A small wellbeing tip for today`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0F1117 0%, #1E2236 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0;">Burnout<span style="color: #D97706;">Guard</span></h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #3B3D47; margin-bottom: 16px;">Hi <strong>${fullName}</strong>,</p>
          <p style="font-size: 14px; color: #3B3D47; margin-bottom: 8px;">Thanks for keeping up with your check-ins. Here's a small tip for today:</p>
          <div style="background: #F0FDF4; border: 1px solid #BBFBBC; border-radius: 10px; padding: 18px 20px; margin: 16px 0 24px;">
            <p style="font-size: 14px; color: #166534; margin: 0; line-height: 1.6;">${tip}</p>
          </div>
          <a href="${frontendUrl}/developer/dashboard" style="display: inline-block; background: #2F5FE0; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
            View My Dashboard
          </a>
          <p style="font-size: 12px; color: #7B7E8C; margin-top: 24px;">You can disable these emails from your profile settings.</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendWeeklyReportEmail(
    to: string,
    fullName: string,
    report: WellnessReport,
    frontendUrl: string
  ): Promise<boolean> {
    const subject = `📊 Your Weekly Wellness Report is ready`;
    const trendColor = report.overallTrend === 'Worsening' ? '#DC2626' : report.overallTrend === 'Improving' ? '#1B8C6E' : '#7B7E8C';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0F1117 0%, #1E2236 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0;">Burnout<span style="color: #D97706;">Guard</span></h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #3B3D47; margin-bottom: 16px;">Hi <strong>${fullName}</strong>,</p>
          <p style="font-size: 14px; color: #3B3D47; margin-bottom: 20px;">Your weekly wellness report is ready:</p>
          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 100px; background: white; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid rgba(15,17,23,0.08);">
              <p style="font-size: 20px; font-weight: 700; color: #3B3D47; margin: 0;">${report.avgStress.toFixed(1)}</p>
              <p style="font-size: 11px; color: #7B7E8C; margin: 4px 0 0;">Avg Stress /10</p>
            </div>
            <div style="flex: 1; min-width: 100px; background: white; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid rgba(15,17,23,0.08);">
              <p style="font-size: 20px; font-weight: 700; color: #3B3D47; margin: 0;">${report.avgSleep.toFixed(1)}h</p>
              <p style="font-size: 11px; color: #7B7E8C; margin: 4px 0 0;">Avg Sleep</p>
            </div>
            <div style="flex: 1; min-width: 100px; background: white; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid rgba(15,17,23,0.08);">
              <p style="font-size: 20px; font-weight: 700; color: #3B3D47; margin: 0;">${report.avgWorkHours.toFixed(1)}h</p>
              <p style="font-size: 11px; color: #7B7E8C; margin: 4px 0 0;">Avg Work Hours</p>
            </div>
          </div>
          <p style="font-size: 13px; font-weight: 600; color: ${trendColor}; margin-bottom: 16px;">Trend: ${report.overallTrend}</p>
          ${report.insightSummary ? `<p style="font-size: 13px; color: #3B3D47; background: #F7F8FA; border-radius: 8px; padding: 14px; line-height: 1.6; margin-bottom: 20px;">${report.insightSummary}</p>` : ''}
          <a href="${frontendUrl}/developer/reports" style="display: inline-block; background: #2F5FE0; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
            View Full Report
          </a>
          <p style="font-size: 12px; color: #7B7E8C; margin-top: 24px;">You can disable weekly report emails from your profile settings.</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }
}

export const EmailService = new EmailServiceClass();