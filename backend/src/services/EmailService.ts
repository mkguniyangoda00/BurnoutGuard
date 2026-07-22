import nodemailer from 'nodemailer';
import { Env } from '../config/env';

/**
 * EmailService
 * 
 * Sends emails via SMTP using nodemailer.
 * Configured via environment variables: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS.
 * 
 * IMPORTANT: You must provide real SMTP credentials (e.g. Gmail App Password,
 * SendGrid, or Mailgun) in .env for this to work.
 */
class EmailServiceClass {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    // Only create transporter if email config is provided
    if (!Env.EMAIL_HOST || !Env.EMAIL_USER || !Env.EMAIL_PASS) {
      console.warn('[EmailService] SMTP not configured — email notifications disabled.');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: Env.EMAIL_HOST,
      port: Env.EMAIL_PORT,
      secure: Env.EMAIL_PORT === 465,
      auth: {
        user: Env.EMAIL_USER,
        pass: Env.EMAIL_PASS,
      },
    });

    return this.transporter;
  }

  /**
   * Send an email. Fire-and-forget safe — never throws.
   * Returns true if sent successfully, false if not.
   */
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

  /**
   * Build and send a burnout risk alert email.
   */
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
          <h1 style="color: #fff; font-size: 24px; margin: 0;">
            Burnout<span style="color: #D97706;">Guard</span>
          </h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #3B3D47; margin-bottom: 16px;">
            Hi <strong>${fullName}</strong>,
          </p>
          <div style="background: white; border-radius: 10px; padding: 20px; border: 1px solid rgba(15,17,23,0.08); margin-bottom: 20px;">
            <p style="font-size: 14px; color: #7B7E8C; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
              Current Risk Level
            </p>
            <p style="font-size: 28px; font-weight: 700; color: ${riskColor}; margin: 0;">
              ${riskLevel}
            </p>
          </div>
          <p style="font-size: 14px; color: #3B3D47; margin-bottom: 24px;">
            Your burnout risk has reached <strong style="color: ${riskColor};">${riskLevel}</strong> level. 
            Please review your personalized recommendations and take proactive steps to manage your wellbeing.
          </p>
          <a href="${frontendUrl}/developer/my-risk" 
             style="display: inline-block; background: #2F5FE0; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
            View My Risk Report
          </a>
          <p style="font-size: 12px; color: #7B7E8C; margin-top: 24px;">
            You can disable email notifications from your profile settings.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Build and send a friendly daily check-in reminder email.
   */
  async sendCheckInReminderEmail(
    to: string,
    fullName: string,
    frontendUrl: string
  ): Promise<boolean> {
    const subject = `👋 Don't forget your daily check-in`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0F1117 0%, #1E2236 100%); padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0;">
            Burnout<span style="color: #D97706;">Guard</span>
          </h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #3B3D47; margin-bottom: 16px;">
            Hi <strong>${fullName}</strong>,
          </p>
          <p style="font-size: 14px; color: #3B3D47; margin-bottom: 24px;">
            We noticed you haven't logged today's check-in yet. It only takes about
            90 seconds and helps keep your burnout risk prediction accurate and up to date.
          </p>
          <a href="${frontendUrl}/developer/check-in"
             style="display: inline-block; background: #2F5FE0; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
            Submit Today's Check-in
          </a>
          <p style="font-size: 12px; color: #7B7E8C; margin-top: 24px;">
            You can disable these reminder emails from your profile settings.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }
}

export const EmailService = new EmailServiceClass();
