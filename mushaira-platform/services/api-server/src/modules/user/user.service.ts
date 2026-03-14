import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { UserQueryDto } from './dto/admin-user.dto';

const USER_SELECT = {
  id: true,
  mobile_number: true,
  full_name: true,
  email: true,
  age: true,
  gender: true,
  city: true,
  profession: true,
  profile_photo: true,
  role: true,
  approval_status: true,
  is_active: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SELECT,
        _count: {
          select: {
            family_members: { where: { is_active: true } },
            registrations: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: userId } },
      });
      if (existing) {
        throw new ConflictException('Email already in use by another account');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });

    this.logger.log(`Profile updated for user: ${userId}`);
    return user;
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { is_active: false },
    });

    return { message: 'Account deactivated successfully' };
  }

  // ─── Super Admin Methods ──────────────────────────────────────────────────

  async findAllAdmin(query: UserQueryDto) {
    const { page = 1, limit = 20, role, search } = query;

    const where: Record<string, unknown> = {};
    if (role) where['role'] = role;
    if (search) {
      where['OR'] = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { mobile_number: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          ...USER_SELECT,
          _count: { select: { registrations: true, family_members: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(users, total, page, limit);
  }

  async changeRole(targetId: string, role: Role) {
    await this.findById(targetId);
    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: USER_SELECT,
    });
    this.logger.log(`User ${targetId} role changed to ${role}`);
    return updated;
  }

  async toggleUserStatus(targetId: string) {
    const user = await this.findById(targetId);
    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { is_active: !user.is_active },
      select: USER_SELECT,
    });
    this.logger.log(
      `User ${targetId} status toggled: ${updated.is_active ? 'active' : 'inactive'}`,
    );
    return updated;
  }

  private async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
