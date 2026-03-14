import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  TooManyRequestsException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { IJwtPayload, IAuthTokens } from '@mushaira/shared-types';
import { addMinutes, isAfter } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto, ipAddress?: string): Promise<{ message: string }> {
    const { mobile_number } = dto;

    // Check recent OTP attempts (rate limiting)
    const recentAttempts = await this.prisma.oTPSession.count({
      where: {
        mobile: mobile_number,
        created_at: {
          gte: new Date(
            Date.now() -
              this.configService.get<number>('otp.otpTtl', 300) * 1000,
          ),
        },
      },
    });

    const maxAttempts = this.configService.get<number>('otp.maxAttempts', 5);

    if (recentAttempts >= maxAttempts) {
      throw new TooManyRequestsException(
        `OTP limit reached. Please try again after ${this.configService.get<number>('otp.expiryMinutes', 5)} minutes.`,
      );
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();
    const expiryMinutes = this.configService.get<number>('otp.expiryMinutes', 5);

    // Invalidate previous unused OTPs
    await this.prisma.oTPSession.updateMany({
      where: { mobile: mobile_number, is_used: false },
      data: { is_used: true },
    });

    // Create new OTP session
    await this.prisma.oTPSession.create({
      data: {
        mobile: mobile_number,
        otp_code: otp,
        ip_address: ipAddress,
        expires_at: addMinutes(new Date(), expiryMinutes),
      },
    });

    // Send OTP via WhatsApp (or fallback to SMS/console in dev)
    await this.deliverOtp(mobile_number, otp);

    this.logger.log(`OTP sent to ${mobile_number}`);

    return {
      message: `OTP sent to ${this.maskMobile(mobile_number)}. Valid for ${expiryMinutes} minutes.`,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, ipAddress?: string): Promise<IAuthTokens> {
    const { mobile_number, otp } = dto;

    const session = await this.prisma.oTPSession.findFirst({
      where: {
        mobile: mobile_number,
        is_used: false,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!session) {
      throw new BadRequestException('No active OTP found. Please request a new OTP.');
    }

    // Check expiry
    if (isAfter(new Date(), session.expires_at)) {
      await this.prisma.oTPSession.update({
        where: { id: session.id },
        data: { is_used: true },
      });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Increment attempts
    const maxAttempts = this.configService.get<number>('otp.maxAttempts', 5);
    const updatedSession = await this.prisma.oTPSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    });

    if (updatedSession.attempts > maxAttempts) {
      await this.prisma.oTPSession.update({
        where: { id: session.id },
        data: { is_used: true },
      });
      throw new TooManyRequestsException('Too many failed attempts. Please request a new OTP.');
    }

    // Verify OTP
    if (session.otp_code !== otp) {
      const remaining = maxAttempts - updatedSession.attempts;
      throw new UnauthorizedException(
        `Invalid OTP. ${remaining} attempt(s) remaining.`,
      );
    }

    // Mark OTP as used
    await this.prisma.oTPSession.update({
      where: { id: session.id },
      data: { is_used: true },
    });

    // Upsert user
    const user = await this.prisma.user.upsert({
      where: { mobile_number },
      update: { last_login_at: new Date() },
      create: { mobile_number, last_login_at: new Date() },
    });

    this.logger.log(`User authenticated: ${user.id} (${mobile_number})`);

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<IAuthTokens> {
    try {
      const payload = this.jwtService.verify<IJwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(user: { id: string; mobile_number: string; role: string }): IAuthTokens {
    const payload: IJwtPayload = {
      sub: user.id,
      mobile: user.mobile_number,
      role: user.role as any,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '30d'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 7 * 24 * 60 * 60,
    };
  }

  private generateOtp(): string {
    if (process.env.NODE_ENV === 'development') {
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async deliverOtp(mobile: string, otp: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      this.logger.warn(`[DEV] OTP for ${mobile}: ${otp}`);
      return;
    }
    // WhatsApp delivery handled by NotificationsService (Step 2 integration)
    this.logger.log(`OTP delivery queued for ${mobile}`);
  }

  private maskMobile(mobile: string): string {
    return mobile.replace(/(\+\d{2})\d+(\d{4})$/, '$1****$2');
  }
}
