import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventStatus, Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import {
  CreateEventDto,
  UpdateEventDto,
  ChangeEventStatusDto,
  EventQueryDto,
} from './dto/event.dto';
import { CreateGateDto, UpdateGateDto } from './dto/gate.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import {
  NotificationEvents,
  EventStatusPayload,
} from '../notification/notification.events';

const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  [EventStatus.PUBLISHED]: [EventStatus.LIVE, EventStatus.CANCELLED],
  [EventStatus.LIVE]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
  [EventStatus.COMPLETED]: [],
  [EventStatus.CANCELLED]: [],
};

const EVENT_LIST_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  poster: true,
  venue: true,
  date_time: true,
  status: true,
  capacity: true,
  family_allowed: true,
  approval_required: true,
  registration_start: true,
  registration_end: true,
  created_at: true,
  organiser: { select: { id: true, name: true, logo: true } },
  _count: { select: { registrations: true } },
} as const;

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── Events ──────────────────────────────────────────────────────────────

  async findAll(query: EventQueryDto, adminView = false) {
    const { page = 1, limit = 20, status, organiser_id, search } = query;

    const where: Record<string, unknown> = {};

    if (!adminView) {
      where['status'] = { in: [EventStatus.PUBLISHED, EventStatus.LIVE] };
    } else if (status) {
      where['status'] = status;
    }

    if (organiser_id) where['organiser_id'] = organiser_id;

    if (search) {
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date_time: 'asc' },
        select: EVENT_LIST_SELECT,
      }),
      this.prisma.event.count({ where }),
    ]);

    return paginate(events, total, page, limit);
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organiser: {
          select: { id: true, name: true, logo: true, website: true },
        },
        gates: {
          where: { is_active: true },
          orderBy: { created_at: 'asc' },
        },
        sponsors: { orderBy: { created_at: 'asc' } },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async create(dto: CreateEventDto) {
    const organiser = await this.prisma.organiser.findUnique({
      where: { id: dto.organiser_id },
    });

    if (!organiser || !organiser.is_active) {
      throw new NotFoundException('Organiser not found or inactive');
    }

    const dateTime = new Date(dto.date_time);
    const regStart = new Date(dto.registration_start);
    const regEnd = new Date(dto.registration_end);

    if (regStart >= regEnd) {
      throw new BadRequestException('Registration start must be before registration end');
    }

    if (regEnd >= dateTime) {
      throw new BadRequestException('Registration must close before the event date');
    }

    const event = await this.prisma.event.create({
      data: {
        organiser_id: dto.organiser_id,
        title: dto.title,
        subtitle: dto.subtitle,
        poster: dto.poster,
        venue: dto.venue,
        date_time: dateTime,
        map_link: dto.map_link,
        description: dto.description,
        registration_start: regStart,
        registration_end: regEnd,
        approval_required: dto.approval_required ?? true,
        capacity: dto.capacity,
        family_allowed: dto.family_allowed ?? true,
      },
      include: {
        organiser: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Event created: ${event.id} — "${event.title}"`);
    return event;
  }

  async update(id: string, dto: UpdateEventDto, userId: string, userRole: Role) {
    const event = await this.findOne(id);

    if (
      event.status !== EventStatus.DRAFT &&
      event.status !== EventStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Only DRAFT or PUBLISHED events can be edited',
      );
    }

    if (userRole === Role.ORGANISER) {
      const organiser = await this.prisma.organiser.findUnique({
        where: { id: event.organiser_id },
      });
      if (!organiser) {
        throw new ForbiddenException('You do not have permission to edit this event');
      }
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.date_time) data['date_time'] = new Date(dto.date_time);
    if (dto.registration_start) data['registration_start'] = new Date(dto.registration_start);
    if (dto.registration_end) data['registration_end'] = new Date(dto.registration_end);

    const updated = await this.prisma.event.update({
      where: { id },
      data,
      include: {
        organiser: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Event updated: ${id} by user ${userId}`);
    return updated;
  }

  async changeStatus(id: string, dto: ChangeEventStatusDto, userId: string) {
    const event = await this.findOne(id);
    const allowed = STATUS_TRANSITIONS[event.status];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${event.status} to ${dto.status}. Allowed transitions: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: dto.status },
    });

    this.logger.log(
      `Event ${id} status changed: ${event.status} → ${dto.status} by user ${userId}`,
    );

    // Fire-and-forget notifications for key status transitions
    if (dto.status === EventStatus.LIVE) {
      this.eventEmitter.emit(NotificationEvents.EVENT_LIVE, {
        eventId: id,
      } satisfies EventStatusPayload);
    } else if (dto.status === EventStatus.COMPLETED) {
      this.eventEmitter.emit(NotificationEvents.EVENT_COMPLETED, {
        eventId: id,
      } satisfies EventStatusPayload);
    }

    return updated;
  }

  // ─── Gates ───────────────────────────────────────────────────────────────

  async getGates(eventId: string) {
    await this.findOne(eventId);
    return this.prisma.gate.findMany({
      where: { event_id: eventId, is_active: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async addGate(eventId: string, dto: CreateGateDto) {
    await this.findOne(eventId);

    const upperCode = dto.code.toUpperCase();
    const existing = await this.prisma.gate.findUnique({
      where: { event_id_code: { event_id: eventId, code: upperCode } },
    });

    if (existing && existing.is_active) {
      throw new ConflictException(
        `Gate with code "${upperCode}" already exists for this event`,
      );
    }

    return this.prisma.gate.create({
      data: { event_id: eventId, name: dto.name, code: upperCode },
    });
  }

  async updateGate(eventId: string, gateId: string, dto: UpdateGateDto) {
    const gate = await this.prisma.gate.findUnique({ where: { id: gateId } });

    if (!gate || !gate.is_active || gate.event_id !== eventId) {
      throw new NotFoundException('Gate not found');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.code) data['code'] = dto.code.toUpperCase();

    return this.prisma.gate.update({ where: { id: gateId }, data });
  }

  async removeGate(eventId: string, gateId: string) {
    const gate = await this.prisma.gate.findUnique({ where: { id: gateId } });

    if (!gate || gate.event_id !== eventId) {
      throw new NotFoundException('Gate not found');
    }

    await this.prisma.gate.update({
      where: { id: gateId },
      data: { is_active: false },
    });

    return { message: 'Gate removed successfully' };
  }

  // ─── Categories ──────────────────────────────────────────────────────────

  async getCategories() {
    return this.prisma.category.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async removeCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    await this.prisma.category.update({
      where: { id },
      data: { is_active: false },
    });
    return { message: 'Category removed successfully' };
  }
}
