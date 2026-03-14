import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  appName: process.env.APP_NAME ?? 'Mushaira Platform API',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
}));

export const otpConfig = registerAs('otp', () => ({
  expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES ?? '5', 10),
  maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
  resendCooldown: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? '60', 10),
}));

export const whatsappConfig = registerAs('whatsapp', () => ({
  apiUrl: process.env.WHATSAPP_API_URL,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  templates: {
    otp: process.env.WHATSAPP_TEMPLATE_OTP ?? 'otp_verification',
    approval: process.env.WHATSAPP_TEMPLATE_APPROVAL ?? 'registration_approved',
    rejection: process.env.WHATSAPP_TEMPLATE_REJECTION ?? 'registration_rejected',
    reminder: process.env.WHATSAPP_TEMPLATE_REMINDER ?? 'event_reminder',
    eventLive: process.env.WHATSAPP_TEMPLATE_EVENT_LIVE ?? 'event_live',
    thankYou: process.env.WHATSAPP_TEMPLATE_THANK_YOU ?? 'event_thank_you',
    received: process.env.WHATSAPP_TEMPLATE_RECEIVED ?? 'registration_received',
  },
}));

export const smtpConfig = registerAs('smtp', () => ({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM ?? 'Mushaira Platform <noreply@jashneurdu.org>',
}));

export const notificationConfig = registerAs('notification', () => ({
  dryRun: process.env.NOTIFICATION_DRY_RUN !== 'false',
}));

export const qrConfig = registerAs('qr', () => ({
  secret: process.env.QR_SECRET,
  expiryHours: parseInt(process.env.QR_EXPIRY_HOURS ?? '48', 10),
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  otpTtl: parseInt(process.env.THROTTLE_OTP_TTL ?? '300', 10),
  otpLimit: parseInt(process.env.THROTTLE_OTP_LIMIT ?? '5', 10),
}));
