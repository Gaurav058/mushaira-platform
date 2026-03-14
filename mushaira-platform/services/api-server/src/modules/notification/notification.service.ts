import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventStatus, NotificationChannel, NotificationType, RegistrationStatus } from '@prisma/client';
import { format } from 'date-fns';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsAppService } from './services/whatsapp.service';
import { EmailService } from './services/email.service';
import {
  NotificationEvents,
  RegistrationEventPayload,
  EventStatusPayload,
} from './notification.events';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
    private email: EmailService,
  ) {}

  // ─── Event Listeners ────────────────────────────────────────────────────

  @OnEvent(NotificationEvents.REGISTRATION_CREATED)
  async handleRegistrationCreated(payload: RegistrationEventPayload) {
    try {
      const reg = await this.fetchRegistrationWithDetails(payload.registrationId);
      if (!reg || !reg.event.approval_required) return;

      const name = reg.user.full_name ?? 'Attendee';
      const eventTitle = reg.event.title;
      const eventDate = format(new Date(reg.event.date_time), 'dd MMM yyyy • hh:mm a');

      await this.dispatch({
        userId: reg.user_id,
        type: NotificationType.REGISTRATION_RECEIVED,
        title: `Registration Received — ${eventTitle}`,
        message: `Hi ${name}, we've received your registration for ${eventTitle} on ${eventDate}. It is pending organiser approval.`,
        mobile: reg.user.mobile_number,
        email: reg.user.email,
        whatsappParams: [name, eventTitle, eventDate],
        emailContent: this.email.buildReceivedEmail(name, eventTitle, eventDate),
        metadata: { event_id: reg.event_id, registration_id: reg.id },
      });
    } catch (err: any) {
      this.logger.error(`handleRegistrationCreated failed: ${err.message}`);
    }
  }

  @OnEvent(NotificationEvents.REGISTRATION_APPROVED)
  async handleRegistrationApproved(payload: RegistrationEventPayload) {
    try {
      const reg = await this.fetchRegistrationWithDetails(payload.registrationId);
      if (!reg) return;

      const name = reg.user.full_name ?? 'Attendee';
      const eventTitle = reg.event.title;
      const eventDate = format(new Date(reg.event.date_time), 'dd MMM yyyy • hh:mm a');
      const qrUrl = reg.qr_pass?.qr_image_url ?? undefined;

      await this.dispatch({
        userId: reg.user_id,
        type: NotificationType.APPROVAL_GRANTED,
        title: `Registration Approved — ${eventTitle}`,
        message: `Hi ${name}, your registration for ${eventTitle} has been approved! Your QR pass is ready.`,
        mobile: reg.user.mobile_number,
        email: reg.user.email,
        whatsappParams: [name, eventTitle, eventDate, reg.event.venue],
        emailContent: {
          ...this.email.buildApprovalEmail(name, eventTitle, eventDate, reg.event.venue, qrUrl),
          to: reg.user.email ?? '',
        },
        metadata: { event_id: reg.event_id, registration_id: reg.id },
      });
    } catch (err: any) {
      this.logger.error(`handleRegistrationApproved failed: ${err.message}`);
    }
  }

  @OnEvent(NotificationEvents.REGISTRATION_REJECTED)
  async handleRegistrationRejected(payload: RegistrationEventPayload) {
    try {
      const reg = await this.fetchRegistrationWithDetails(payload.registrationId);
      if (!reg) return;

      const name = reg.user.full_name ?? 'Attendee';
      const eventTitle = reg.event.title;
      const notes = payload.notes ?? reg.notes ?? undefined;

      await this.dispatch({
        userId: reg.user_id,
        type: NotificationType.REGISTRATION_REJECTED,
        title: `Registration Update — ${eventTitle}`,
        message: `Hi ${name}, your registration for ${eventTitle} was not approved.${notes ? ` Reason: ${notes}` : ''}`,
        mobile: reg.user.mobile_number,
        email: reg.user.email,
        whatsappParams: [name, eventTitle, notes ?? 'N/A'],
        emailContent: {
          ...this.email.buildRejectionEmail(name, eventTitle, notes),
          to: reg.user.email ?? '',
        },
        metadata: { event_id: reg.event_id, registration_id: reg.id },
      });
    } catch (err: any) {
      this.logger.error(`handleRegistrationRejected failed: ${err.message}`);
    }
  }

  @OnEvent(NotificationEvents.EVENT_LIVE)
  async handleEventLive(payload: EventStatusPayload) {
    try {
      const event = await this.prisma.event.findUnique({ where: { id: payload.eventId } });
      if (!event) return;

      const registrations = await this.prisma.eventRegistration.findMany({
        where: { event_id: payload.eventId, status: RegistrationStatus.APPROVED },
        include: { user: { select: { id: true, full_name: true, mobile_number: true, email: true } } },
      });

      this.logger.log(
        `EVENT_LIVE: sending to ${registrations.length} attendees for "${event.title}"`,
      );

      for (const reg of registrations) {
        const name = reg.user.full_name ?? 'Attendee';
        await this.dispatch({
          userId: reg.user_id,
          type: NotificationType.EVENT_LIVE,
          title: `${event.title} is LIVE! 🎤`,
          message: `Hi ${name}, ${event.title} is now live at ${event.venue}! Show your QR pass at the entrance.`,
          mobile: reg.user.mobile_number,
          email: reg.user.email,
          whatsappParams: [name, event.title, event.venue],
          emailContent: {
            ...this.email.buildEventLiveEmail(name, event.title, event.venue),
            to: reg.user.email ?? '',
          },
          metadata: { event_id: event.id, registration_id: reg.id },
        });
      }
    } catch (err: any) {
      this.logger.error(`handleEventLive failed: ${err.message}`);
    }
  }

  @OnEvent(NotificationEvents.EVENT_COMPLETED)
  async handleEventCompleted(payload: EventStatusPayload) {
    try {
      const event = await this.prisma.event.findUnique({ where: { id: payload.eventId } });
      if (!event) return;

      const registrations = await this.prisma.eventRegistration.findMany({
        where: { event_id: payload.eventId, status: RegistrationStatus.CHECKED_IN },
        include: { user: { select: { id: true, full_name: true, mobile_number: true, email: true } } },
      });

      this.logger.log(
        `THANK_YOU: sending to ${registrations.length} checked-in attendees for "${event.title}"`,
      );

      for (const reg of registrations) {
        const name = reg.user.full_name ?? 'Attendee';
        await this.dispatch({
          userId: reg.user_id,
          type: NotificationType.THANK_YOU,
          title: `Thank You for Attending — ${event.title}`,
          message: `Thank you for attending ${event.title}, ${name}! We hope to see you at the next mushaira.`,
          mobile: reg.user.mobile_number,
          email: reg.user.email,
          whatsappParams: [name, event.title],
          emailContent: {
            ...this.email.buildThankYouEmail(name, event.title),
            to: reg.user.email ?? '',
          },
          metadata: { event_id: event.id, registration_id: reg.id },
        });
      }
    } catch (err: any) {
      this.logger.error(`handleEventCompleted failed: ${err.message}`);
    }
  }

  // ─── Cron: Scheduled Reminders ──────────────────────────────────────────

  @Cron('0 */15 * * * *', { name: 'event-reminders' })
  async handleScheduledReminders() {
    const now = new Date();

    // 24-hour reminder window: events in 22–26 hours
    await this.sendReminderBatch(
      new Date(now.getTime() + 22 * 60 * 60 * 1000),
      new Date(now.getTime() + 26 * 60 * 60 * 1000),
      NotificationType.REMINDER_24HR,
      '24 hours',
    );

    // 3-hour reminder window: events in 2.5–3.5 hours
    await this.sendReminderBatch(
      new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
      new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
      NotificationType.REMINDER_3HR,
      '3 hours',
    );
  }

  private async sendReminderBatch(
    windowStart: Date,
    windowEnd: Date,
    type: NotificationType,
    timeLabel: string,
  ) {
    const events = await this.prisma.event.findMany({
      where: {
        date_time: { gte: windowStart, lte: windowEnd },
        status: { in: [EventStatus.PUBLISHED, EventStatus.LIVE] },
      },
    });

    if (events.length === 0) return;
    this.logger.log(`${type}: ${events.length} events in window`);

    for (const event of events) {
      const registrations = await this.prisma.eventRegistration.findMany({
        where: { event_id: event.id, status: RegistrationStatus.APPROVED },
        include: { user: { select: { id: true, full_name: true, mobile_number: true, email: true } } },
      });

      for (const reg of registrations) {
        // Skip if already notified for this event + type
        const alreadySent = await this.prisma.notification.findFirst({
          where: {
            user_id: reg.user_id,
            type,
            is_sent: true,
            metadata: { path: ['event_id'], equals: event.id },
          },
        });
        if (alreadySent) continue;

        const name = reg.user.full_name ?? 'Attendee';
        const eventDate = format(new Date(event.date_time), 'dd MMM yyyy • hh:mm a');

        await this.dispatch({
          userId: reg.user_id,
          type,
          title: `Reminder: ${event.title} in ${timeLabel}`,
          message: `Hi ${name}, ${event.title} starts in ${timeLabel} at ${event.venue}.`,
          mobile: reg.user.mobile_number,
          email: reg.user.email,
          whatsappParams: [name, event.title, timeLabel, event.venue],
          emailContent: {
            ...this.email.buildReminderEmail(name, event.title, eventDate, event.venue, timeLabel),
            to: reg.user.email ?? '',
          },
          metadata: { event_id: event.id, registration_id: reg.id },
        });
      }
    }
  }

  // ─── Core Dispatch ──────────────────────────────────────────────────────

  private async dispatch(opts: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    mobile: string;
    email: string | null;
    whatsappParams: string[];
    emailContent: { to: string; subject: string; html: string };
    metadata?: Record<string, unknown>;
  }) {
    const channels = [
      { channel: NotificationChannel.WHATSAPP, send: () => this.sendWhatsApp(opts) },
      { channel: NotificationChannel.EMAIL,     send: () => this.sendEmail(opts) },
    ];

    for (const { channel, send } of channels) {
      let isSent = false;
      let error: string | undefined;

      try {
        isSent = await send();
      } catch (err: any) {
        error = err.message;
      }

      await this.prisma.notification.create({
        data: {
          user_id: opts.userId,
          type: opts.type,
          title: opts.title,
          message: opts.message,
          channel,
          is_sent: isSent,
          sent_at: isSent ? new Date() : null,
          error: error ?? null,
          metadata: opts.metadata ?? {},
        },
      });
    }
  }

  private async sendWhatsApp(opts: { type: NotificationType; mobile: string; whatsappParams: string[] }): Promise<boolean> {
    const msg = this.whatsapp.buildMessage(opts.type, opts.mobile, opts.whatsappParams);
    return this.whatsapp.send(msg);
  }

  private async sendEmail(opts: {
    email: string | null;
    emailContent: { to: string; subject: string; html: string };
  }): Promise<boolean> {
    if (!opts.email) return false;
    return this.email.send({ ...opts.emailContent, to: opts.email });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private fetchRegistrationWithDetails(registrationId: string) {
    return this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        user: { select: { id: true, full_name: true, mobile_number: true, email: true } },
        event: { select: { id: true, title: true, venue: true, date_time: true, approval_required: true } },
        qr_pass: { select: { qr_image_url: true } },
      },
    });
  }
}
