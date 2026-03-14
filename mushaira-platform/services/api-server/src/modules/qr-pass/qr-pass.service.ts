import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as CryptoJS from 'crypto-js';
import { addHours } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class QrPassService {
  private readonly logger = new Logger(QrPassService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generate(registrationId: string, eventId: string) {
    const existing = await this.prisma.qRPass.findUnique({
      where: { registration_id: registrationId },
    });
    if (existing) return existing;

    const qrCode = uuidv4();
    const secret = this.configService.get<string>('qr.secret') ?? '';
    const secureHash = CryptoJS.HmacSHA256(
      `${eventId}:${registrationId}:${qrCode}`,
      secret,
    ).toString();

    const expiryHours = this.configService.get<number>('qr.expiryHours', 48);
    const expiresAt = addHours(new Date(), expiryHours);

    const qrImageUrl = await QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: { dark: '#5B2C83', light: '#FFFFFF' },
    });

    const pass = await this.prisma.qRPass.create({
      data: {
        registration_id: registrationId,
        event_id: eventId,
        qr_code: qrCode,
        secure_hash: secureHash,
        qr_image_url: qrImageUrl,
        expires_at: expiresAt,
      },
    });

    this.logger.log(`QR pass generated for registration: ${registrationId}`);
    return pass;
  }

  async getForUser(registrationId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      select: { user_id: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const pass = await this.prisma.qRPass.findUnique({
      where: { registration_id: registrationId },
    });

    if (!pass) {
      throw new NotFoundException('QR pass not found. Registration may not be approved yet.');
    }

    return pass;
  }

  verifyHash(
    eventId: string,
    registrationId: string,
    qrCode: string,
    hash: string,
  ): boolean {
    const secret = this.configService.get<string>('qr.secret') ?? '';
    const expected = CryptoJS.HmacSHA256(
      `${eventId}:${registrationId}:${qrCode}`,
      secret,
    ).toString();
    return expected === hash;
  }
}
