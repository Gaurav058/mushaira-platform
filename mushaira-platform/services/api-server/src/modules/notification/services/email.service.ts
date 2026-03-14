import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationType } from '@prisma/client';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  notificationType: NotificationType;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly dryRun: boolean;
  private readonly from: string;
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.dryRun = this.config.get<boolean>('notification.dryRun', true);
    this.from = this.config.get<string>('smtp.from') ?? 'Mushaira Platform <noreply@jashneurdu.org>';

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('smtp.host'),
      port: this.config.get<number>('smtp.port'),
      secure: this.config.get<boolean>('smtp.secure'),
      auth: {
        user: this.config.get<string>('smtp.user'),
        pass: this.config.get<string>('smtp.pass'),
      },
    });
  }

  async send(message: EmailMessage): Promise<boolean> {
    if (!message.to || !message.to.includes('@')) return false;

    if (this.dryRun) {
      this.logger.log(
        `[DRY-RUN] Email → ${message.to} | subject: ${message.subject}`,
      );
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
      });
      this.logger.log(`Email sent → ${message.to} | subject: ${message.subject}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Email failed → ${message.to}: ${err.message}`);
      return false;
    }
  }

  buildApprovalEmail(name: string, eventTitle: string, eventDate: string, venue: string, qrUrl?: string): EmailMessage {
    const qrSection = qrUrl
      ? `<p style="margin-top:16px">Your QR pass is ready:</p><img src="${qrUrl}" alt="QR Pass" style="width:200px;height:200px;border-radius:12px"/>`
      : `<p style="margin-top:16px">Your QR pass will be available shortly in the app.</p>`;

    return {
      to: '',
      subject: `✅ Registration Approved — ${eventTitle}`,
      notificationType: NotificationType.APPROVAL_GRANTED,
      html: this.wrapHtml(`
        <h2 style="color:#5B2C83">Registration Approved! 🎉</h2>
        <p>Dear <strong>${name ?? 'Attendee'}</strong>,</p>
        <p>Your registration for <strong>${eventTitle}</strong> has been approved.</p>
        <table style="margin:16px 0;border-collapse:collapse">
          <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Event</td><td><strong>${eventTitle}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Date</td><td><strong>${eventDate}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Venue</td><td><strong>${venue}</strong></td></tr>
        </table>
        ${qrSection}
        <p style="color:#666;font-size:13px;margin-top:24px">Please bring your QR pass (digital or printed) for entry.</p>
      `),
    };
  }

  buildRejectionEmail(name: string, eventTitle: string, notes?: string): EmailMessage {
    return {
      to: '',
      subject: `Registration Update — ${eventTitle}`,
      notificationType: NotificationType.REGISTRATION_REJECTED,
      html: this.wrapHtml(`
        <h2 style="color:#C0392B">Registration Update</h2>
        <p>Dear <strong>${name ?? 'Attendee'}</strong>,</p>
        <p>Unfortunately, your registration for <strong>${eventTitle}</strong> could not be approved at this time.</p>
        ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
        <p style="color:#666;font-size:13px">You may contact the organiser for further information. Thank you for your interest.</p>
      `),
    };
  }

  buildReceivedEmail(name: string, eventTitle: string, eventDate: string): EmailMessage {
    return {
      to: '',
      subject: `Registration Received — ${eventTitle}`,
      notificationType: NotificationType.REGISTRATION_RECEIVED,
      html: this.wrapHtml(`
        <h2 style="color:#5B2C83">Registration Received 🎟</h2>
        <p>Dear <strong>${name ?? 'Attendee'}</strong>,</p>
        <p>We have received your registration for <strong>${eventTitle}</strong> on <strong>${eventDate}</strong>.</p>
        <p>Your registration is currently <strong>pending organiser approval</strong>. You will receive another notification once it is reviewed.</p>
      `),
    };
  }

  buildReminderEmail(name: string, eventTitle: string, eventDate: string, venue: string, timeLabel: string): EmailMessage {
    return {
      to: '',
      subject: `⏰ Reminder: ${eventTitle} starts in ${timeLabel}`,
      notificationType: NotificationType.REMINDER_24HR,
      html: this.wrapHtml(`
        <h2 style="color:#5B2C83">Event Reminder ⏰</h2>
        <p>Dear <strong>${name ?? 'Attendee'}</strong>,</p>
        <p><strong>${eventTitle}</strong> starts in <strong>${timeLabel}</strong>.</p>
        <table style="margin:16px 0;border-collapse:collapse">
          <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Date</td><td><strong>${eventDate}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Venue</td><td><strong>${venue}</strong></td></tr>
        </table>
        <p style="color:#666;font-size:13px">Please have your QR pass ready for entry.</p>
      `),
    };
  }

  buildEventLiveEmail(name: string, eventTitle: string, venue: string): EmailMessage {
    return {
      to: '',
      subject: `🔴 LIVE NOW — ${eventTitle}`,
      notificationType: NotificationType.EVENT_LIVE,
      html: this.wrapHtml(`
        <h2 style="color:#C0392B">${eventTitle} is LIVE! 🎤</h2>
        <p>Dear <strong>${name ?? 'Attendee'}</strong>,</p>
        <p><strong>${eventTitle}</strong> has just gone live at <strong>${venue}</strong>.</p>
        <p>Please proceed to the venue and show your QR pass at the entrance.</p>
      `),
    };
  }

  buildThankYouEmail(name: string, eventTitle: string): EmailMessage {
    return {
      to: '',
      subject: `Thank You for Attending — ${eventTitle}`,
      notificationType: NotificationType.THANK_YOU,
      html: this.wrapHtml(`
        <h2 style="color:#D4AF37">शुक्रिया — Thank You! 🙏</h2>
        <p>Dear <strong>${name ?? 'Attendee'}</strong>,</p>
        <p>Thank you for attending <strong>${eventTitle}</strong>. Your presence made this mushaira truly special.</p>
        <p style="font-style:italic;color:#5B2C83;font-size:16px">"Poetry is not just written — it is lived in moments like these."</p>
        <p style="color:#666;font-size:13px">We hope to see you at our next event. Stay connected with Mushaira!</p>
      `),
    };
  }

  private wrapHtml(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0">
            <tr><td align="center">
              <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                <!-- Header -->
                <tr><td style="background:#5B2C83;padding:24px 32px">
                  <h1 style="margin:0;color:#D4AF37;font-size:28px;font-family:Georgia,serif;letter-spacing:1px">Mushaira</h1>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px">Poetry & Literary Events Platform</p>
                </td></tr>
                <!-- Content -->
                <tr><td style="padding:32px;color:#1A1A2E;font-size:15px;line-height:1.6">
                  ${content}
                </td></tr>
                <!-- Footer -->
                <tr><td style="background:#f9f9fb;padding:16px 32px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee">
                  <p style="margin:0">Mushaira Platform · Aeronex Technologies</p>
                  <p style="margin:4px 0 0">This is an automated notification. Please do not reply to this email.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `;
  }
}
