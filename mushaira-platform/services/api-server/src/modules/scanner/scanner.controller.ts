import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ScannerService } from './scanner.service';
import { ScanQrDto } from './dto/scan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Scanner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SCANNER, Role.ORGANISER, Role.SUPER_ADMIN)
  @Post('scan')
  @ApiOperation({ summary: 'Scan an attendee QR pass at the gate [SCANNER, ORGANISER, SUPER_ADMIN]' })
  @ApiResponse({ status: 200, description: 'Scan result with attendee info' })
  scan(
    @Body() dto: ScanQrDto,
    @CurrentUser('id') scannerId: string,
  ) {
    return this.scannerService.scan(dto, scannerId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SCANNER, Role.ORGANISER, Role.SUPER_ADMIN)
  @Get('gates/:gateId/stats')
  @ApiOperation({ summary: 'Get real-time entry statistics for a gate [SCANNER, ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'gateId', type: 'string', format: 'uuid' })
  getGateStats(@Param('gateId', ParseUUIDPipe) gateId: string) {
    return this.scannerService.getGateStats(gateId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Get('events/:eventId/logs')
  @ApiOperation({ summary: 'Get all entry logs for an event [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'eventId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getEventEntryLogs(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.scannerService.getEventEntryLogs(
      eventId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }
}
