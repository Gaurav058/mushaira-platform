import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RegistrationService } from './registration.service';
import { QrPassService } from '../qr-pass/qr-pass.service';
import {
  CreateRegistrationDto,
  RejectRegistrationDto,
  RegistrationQueryDto,
} from './dto/registration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('registrations')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly qrPassService: QrPassService,
  ) {}

  @Post('events/:eventId')
  @ApiOperation({ summary: 'Register current user for an event' })
  @ApiParam({ name: 'eventId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Registration submitted' })
  @ApiResponse({ status: 409, description: 'Already registered' })
  register(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.registrationService.register(eventId, userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user registrations' })
  getMyRegistrations(
    @CurrentUser('id') userId: string,
    @Query() query: RegistrationQueryDto,
  ) {
    return this.registrationService.getMyRegistrations(userId, query);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Get('events/:eventId')
  @ApiOperation({ summary: 'Get all registrations for an event [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'eventId', type: 'string', format: 'uuid' })
  getEventRegistrations(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() query: RegistrationQueryDto,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.registrationService.getEventRegistrations(
      eventId,
      query,
      userRole,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific registration (owner or organiser)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.registrationService.getById(id, userId, userRole);
  }

  @Get(':id/qr-pass')
  @ApiOperation({ summary: 'Get QR pass for a registration (owner only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'QR pass retrieved' })
  @ApiResponse({ status: 404, description: 'Pass not found — registration may not be approved yet' })
  getQrPass(
    @Param('id', ParseUUIDPipe) registrationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.qrPassService.getForUser(registrationId, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a registration [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Registration approved and QR pass generated' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.registrationService.approve(id, reviewerId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a registration [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: RejectRegistrationDto,
  ) {
    return this.registrationService.reject(id, reviewerId, dto);
  }
}
