import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationType } from '@prisma/client';

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  parameters: string[];
  notificationType: NotificationType;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly dryRun: boolean;
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly templates: Record<string, string>;

  constructor(private config: ConfigService) {
    this.dryRun = this.config.get<boolean>('notification.dryRun', true);
    this.apiUrl = this.config.get<string>('whatsapp.apiUrl') ?? 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = this.config.get<string>('whatsapp.phoneNumberId') ?? '';
    this.accessToken = this.config.get<string>('whatsapp.accessToken') ?? '';
    this.templates = this.config.get('whatsapp.templates');
  }

  async send(message: WhatsAppTemplateMessage): Promise<boolean> {
    if (this.dryRun) {
      this.logger.log(
        `[DRY-RUN] WhatsApp → ${message.to} | template: ${message.templateName} | params: ${message.parameters.join(', ')}`,
      );
      return true;
    }

    try {
      await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: message.to,
          type: 'template',
          template: {
            name: message.templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: message.parameters.map((p) => ({
                  type: 'text',
                  text: p,
                })),
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(
        `WhatsApp sent → ${message.to} | template: ${message.templateName}`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `WhatsApp failed → ${message.to}: ${err?.response?.data?.error?.message ?? err.message}`,
      );
      return false;
    }
  }

  buildMessage(type: NotificationType, to: string, params: string[]): WhatsAppTemplateMessage {
    const templateMap: Partial<Record<NotificationType, string>> = {
      REGISTRATION_RECEIVED: this.templates.received,
      APPROVAL_GRANTED: this.templates.approval,
      REGISTRATION_REJECTED: this.templates.rejection,
      REMINDER_24HR: this.templates.reminder,
      REMINDER_3HR: this.templates.reminder,
      EVENT_LIVE: this.templates.eventLive,
      THANK_YOU: this.templates.thankYou,
    };

    return {
      to,
      templateName: templateMap[type] ?? 'notification',
      parameters: params,
      notificationType: type,
    };
  }
}
