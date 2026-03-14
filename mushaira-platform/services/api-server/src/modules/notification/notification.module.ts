import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationsQueryService } from './notification-query.service';
import { WhatsAppService } from './services/whatsapp.service';
import { EmailService } from './services/email.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationsQueryService,
    WhatsAppService,
    EmailService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
