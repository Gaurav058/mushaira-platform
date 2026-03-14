import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventStatus, RegistrationStatus, Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QrPassService } from '../qr-pass/qr-pass.service';
import { paginate } from '../../common/dto/pagination.dto';
import {
  CreateRegistrationDto,
  RejectRegistrationDto,
  RegistrationQueryDto,
} from './dto/registration.dto';
import {
  NotificationEvents,
  RegistrationEventPayload,
} from '../notification/notification.events';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private prisma: PrismaService,
    private qrPassService: QrPassService,
    private eventEmitter: EventEmitter2,
  ) {}

  async register(eventId: string, userId: string, dto: CreateRegistrationDto) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      event.status !== EventStatus.PUBLISHED &&
      event.status !== EventStatus.LIVE
    ) {
      throw new BadRequestException('Registrations are not open for this event');
    }

    const now = new Date();
    if (now < event.registration_start || now > event.registration_end) {
      throw new BadRequestException('Event registration period is not currently open');
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    });

    if (existing) {
      throw new ConflictException('You have already registered for this event');
    }

    // Check capacity
    const approvedCount = await this.prisma.eventRegistration.count({
      where: {
        event_id: eventId,
        status: {
          in: [
            RegistrationStatus.APPROVED,
            RegistrationStatus.CHECKED_IN,
            RegistrationStatus.PENDING,
          ],
        },
      },
    });

    if (approvedCount >= event.capacity) {
      const registration = await this.prisma.eventRegistration.create({
        data: {
          event_id: eventId,
          user_id: userId,
          category_id: dto.category_id,
          notes: dto.notes,
          family_members: dto.family_member_ids ?? [],
          status: RegistrationStatus.WAITLIST,
        },
      });
      return { ...registration, message: 'Event is at capacity. You have been added to the waitlist.' };
    }

    // Determine initial status
    const initialStatus = event.approval_required
      ? RegistrationStatus.PENDING
      : RegistrationStatus.APPROVED;

    const registration = await this.prisma.eventRegistration.create({
      data: {
        event_id: eventId,
        user_id: userId,
        category_id: dto.category_id,
        notes: dto.notes,
        family_members: dto.family_member_ids ?? [],
        status: initialStatus,
      },
      include: {
        event: { select: { id: true, title: true, venue: true, date_time: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });

    // Auto-generate QR pass if no approval required
    if (!event.approval_required) {
      await this.qrPassService.generate(registration.id, eventId);
      this.logger.log(`Registration auto-approved and QR generated: ${registration.id}`);
    } else {
      this.logger.log(`Registration pending approval: ${registration.id}`);
      // Notify user that registration was received and is pending
      this.eventEmitter.emit(NotificationEvents.REGISTRATION_CREATED, {
        registrationId: registration.id,
        eventId,
      } satisfies RegistrationEventPayload);
    }

    return registration;
  }

  async getMyRegistrations(userId: string, query: RegistrationQueryDto) {
    const { page = 1, limit = 20, status } = query;

    const where: Record<string, unknown> = { user_id: userId };
    if (status) where['status'] = status;

    const [registrations, total] = await this.prisma.$transaction([
      this.prisma.eventRegistration.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              subtitle: true,
              poster: true,
              venue: true,
              date_time: true,
              status: true,
            },
          },
          category: { select: { id: true, name: true, color: true } },
          qr_pass: {
            select: {
              id: true,
              qr_image_url: true,
              is_used: true,
              expires_at: true,
            },
          },
        },
      }),
      this.prisma.eventRegistration.count({ where }),
    ]);

    return paginate(registrations, total, page, limit);
  }

  async getEventRegistrations(
    eventId: string,
    query: RegistrationQueryDto,
    userRole: Role,
  ) {
    if (userRole !== Role.ORGANISER && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Access restricted to organisers');
    }

    const { page = 1, limit = 20, status } = query;

    const where: Record<string, unknown> = { event_id: eventId };
    if (status) where['status'] = status;

    const [registrations, total] = await this.prisma.$transaction([
      this.prisma.eventRegistration.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              mobile_number: true,
              city: true,
            },
          },
          category: { select: { id: true, name: true, color: true } },
          qr_pass: { select: { id: true, is_used: true, used_at: true } },
        },
      }),
      this.prisma.eventRegistration.count({ where }),
    ]);

    return paginate(registrations, total, page, limit);
  }

  async getById(registrationId: string, userId: string, userRole: Role) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            venue: true,
            date_time: true,
            status: true,
          },
        },
        user: {
          select: { id: true, full_name: true, mobile_number: true },
        },
        category: { select: { id: true, name: true, color: true } },
        qr_pass: {
          select: {
            id: true,
            qr_code: true,
            qr_image_url: true,
            is_used: true,
            used_at: true,
            expires_at: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const isOwner = registration.user_id === userId;
    const isAdmin =
      userRole === Role.ORGANISER || userRole === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return registration;
  }

  async approve(registrationId: string, reviewerId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: { select: { id: true } } },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException(
        `Registration is already ${registration.status}. Only PENDING registrations can be approved.`,
      );
    }

    const updated = await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.APPROVED,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      },
    });

    await this.qrPassService.generate(registrationId, registration.event.id);

    this.logger.log(`Registration approved: ${registrationId} by ${reviewerId}`);

    this.eventEmitter.emit(NotificationEvents.REGISTRATION_APPROVED, {
      registrationId,
      eventId: registration.event.id,
    } satisfies RegistrationEventPayload);

    return updated;
  }

  async reject(
    registrationId: string,
    reviewerId: string,
    dto: RejectRegistrationDto,
  ) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (
      registration.status !== RegistrationStatus.PENDING &&
      registration.status !== RegistrationStatus.WAITLIST
    ) {
      throw new BadRequestException(
        `Registration cannot be rejected from status ${registration.status}`,
      );
    }

    const updated = await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.REJECTED,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        notes: dto.notes,
      },
    });

    this.logger.log(`Registration rejected: ${registrationId} by ${reviewerId}`);

    this.eventEmitter.emit(NotificationEvents.REGISTRATION_REJECTED, {
      registrationId,
      eventId: registration.event_id,
      notes: dto.notes,
    } satisfies RegistrationEventPayload);

    return updated;
  }
}
