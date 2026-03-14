import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsQueryService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { user_id: userId, is_sent: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          channel: true,
          sent_at: true,
          created_at: true,
        },
      }),
      this.prisma.notification.count({
        where: { user_id: userId, is_sent: true },
      }),
    ]);

    return paginate(notifications, total, page, limit);
  }
}
