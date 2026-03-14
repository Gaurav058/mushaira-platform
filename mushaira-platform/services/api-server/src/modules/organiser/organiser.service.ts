import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import {
  CreateOrganiserDto,
  UpdateOrganiserDto,
  OrganiserQueryDto,
} from './dto/organiser.dto';

@Injectable()
export class OrganiserService {
  private readonly logger = new Logger(OrganiserService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: OrganiserQueryDto) {
    const { page = 1, limit = 20, search } = query;

    const where: Record<string, unknown> = {};
    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [organisers, total] = await this.prisma.$transaction([
      this.prisma.organiser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: { select: { events: true } },
        },
      }),
      this.prisma.organiser.count({ where }),
    ]);

    return paginate(organisers, total, page, limit);
  }

  async findOne(id: string) {
    const organiser = await this.prisma.organiser.findUnique({
      where: { id },
      include: {
        _count: { select: { events: true } },
        events: {
          orderBy: { created_at: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            date_time: true,
            _count: { select: { registrations: true } },
          },
        },
      },
    });

    if (!organiser) {
      throw new NotFoundException('Organiser not found');
    }

    return organiser;
  }

  async create(dto: CreateOrganiserDto) {
    const existing = await this.prisma.organiser.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An organiser with this email already exists');
    }

    const organiser = await this.prisma.organiser.create({ data: dto });
    this.logger.log(`Organiser created: ${organiser.id} — "${organiser.name}"`);
    return organiser;
  }

  async update(id: string, dto: UpdateOrganiserDto) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.organiser.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Email already in use by another organiser');
      }
    }

    return this.prisma.organiser.update({ where: { id }, data: dto });
  }

  async toggleStatus(id: string) {
    const organiser = await this.findOne(id);
    const updated = await this.prisma.organiser.update({
      where: { id },
      data: { is_active: !organiser.is_active },
    });
    this.logger.log(
      `Organiser ${id} status toggled: ${updated.is_active ? 'active' : 'inactive'}`,
    );
    return updated;
  }

  async getPlatformStats() {
    const [
      totalOrganisers,
      activeOrganisers,
      totalEvents,
      totalRegistrations,
      liveEvents,
    ] = await this.prisma.$transaction([
      this.prisma.organiser.count(),
      this.prisma.organiser.count({ where: { is_active: true } }),
      this.prisma.event.count(),
      this.prisma.eventRegistration.count(),
      this.prisma.event.count({ where: { status: 'LIVE' } }),
    ]);

    return {
      organisers: { total: totalOrganisers, active: activeOrganisers },
      events: { total: totalEvents, live: liveEvents },
      registrations: { total: totalRegistrations },
    };
  }
}
