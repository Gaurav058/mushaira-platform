import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateFamilyMemberDto,
  UpdateFamilyMemberDto,
} from './dto/family-member.dto';

const MAX_FAMILY_MEMBERS = 10;

@Injectable()
export class FamilyMemberService {
  private readonly logger = new Logger(FamilyMemberService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.familyMember.findMany({
      where: { user_id: userId, is_active: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(userId: string, memberId: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
    });

    if (!member || !member.is_active) {
      throw new NotFoundException('Family member not found');
    }

    if (member.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return member;
  }

  async create(userId: string, dto: CreateFamilyMemberDto) {
    const count = await this.prisma.familyMember.count({
      where: { user_id: userId, is_active: true },
    });

    if (count >= MAX_FAMILY_MEMBERS) {
      throw new BadRequestException(
        `Maximum of ${MAX_FAMILY_MEMBERS} family members allowed per account`,
      );
    }

    const member = await this.prisma.familyMember.create({
      data: { ...dto, user_id: userId },
    });

    this.logger.log(`Family member created for user: ${userId}`);
    return member;
  }

  async update(userId: string, memberId: string, dto: UpdateFamilyMemberDto) {
    await this.findOne(userId, memberId);

    return this.prisma.familyMember.update({
      where: { id: memberId },
      data: dto,
    });
  }

  async remove(userId: string, memberId: string) {
    await this.findOne(userId, memberId);

    await this.prisma.familyMember.update({
      where: { id: memberId },
      data: { is_active: false },
    });

    return { message: 'Family member removed successfully' };
  }
}
