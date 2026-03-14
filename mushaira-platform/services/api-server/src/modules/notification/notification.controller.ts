import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsQueryService } from './notification-query.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly queryService: NotificationsQueryService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user notification history' })
  getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationDto,
  ) {
    return this.queryService.getUserNotifications(userId, query);
  }
}
