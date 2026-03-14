import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import {
  appConfig,
  jwtConfig,
  redisConfig,
  otpConfig,
  whatsappConfig,
  smtpConfig,
  qrConfig,
  throttleConfig,
  notificationConfig,
} from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { FamilyMemberModule } from './modules/family-member/family-member.module';
import { EventModule } from './modules/event/event.module';
import { QrPassModule } from './modules/qr-pass/qr-pass.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { ScannerModule } from './modules/scanner/scanner.module';
import { OrganiserModule } from './modules/organiser/organiser.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        jwtConfig,
        redisConfig,
        otpConfig,
        whatsappConfig,
        smtpConfig,
        qrConfig,
        throttleConfig,
        notificationConfig,
      ],
      validationSchema,
      expandVariables: true,
    }),
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UserModule,
    FamilyMemberModule,
    EventModule,
    QrPassModule,
    RegistrationModule,
    ScannerModule,
    OrganiserModule,
    NotificationModule,
  ],
})
export class AppModule {}
