import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { EventService } from './event.service';
import {
  CreateEventDto,
  UpdateEventDto,
  ChangeEventStatusDto,
  EventQueryDto,
} from './dto/event.dto';
import { CreateGateDto, UpdateGateDto } from './dto/gate.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ─── Category Routes (declared before /:id to avoid route shadowing) ─────

  @Get('categories')
  @ApiOperation({ summary: 'List all active registration categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  getCategories() {
    return this.eventService.getCategories();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('categories')
  @ApiOperation({ summary: 'Create a registration category [SUPER_ADMIN]' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.eventService.createCategory(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category [SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.eventService.updateCategory(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a category [SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.removeCategory(id);
  }

  // ─── Manage Route (declared before /:id) ─────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Get('manage')
  @ApiOperation({ summary: 'List all events including drafts [ORGANISER, SUPER_ADMIN]' })
  findAllForManagement(@Query() query: EventQueryDto) {
    return this.eventService.findAll(query, true);
  }

  // ─── Public Event Routes ──────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List published and live events (public)' })
  findAll(@Query() query: EventQueryDto) {
    return this.eventService.findAll(query, false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full event details (public)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.findOne(id);
  }

  // ─── Protected Event Write Routes ─────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new event [ORGANISER, SUPER_ADMIN]' })
  @ApiResponse({ status: 201, description: 'Event created' })
  create(@Body() dto: CreateEventDto) {
    return this.eventService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update event details [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.eventService.update(id, dto, userId, userRole);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Change event status [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeEventStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventService.changeStatus(id, dto, userId);
  }

  // ─── Gate Routes ──────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/gates')
  @ApiOperation({ summary: 'List gates for an event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getGates(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.getGates(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Post(':id/gates')
  @ApiOperation({ summary: 'Add a gate to an event [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  addGate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGateDto,
  ) {
    return this.eventService.addGate(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Patch(':id/gates/:gateId')
  @ApiOperation({ summary: 'Update a gate [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'gateId', type: 'string', format: 'uuid' })
  updateGate(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('gateId', ParseUUIDPipe) gateId: string,
    @Body() dto: UpdateGateDto,
  ) {
    return this.eventService.updateGate(eventId, gateId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANISER, Role.SUPER_ADMIN)
  @Delete(':id/gates/:gateId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a gate from an event [ORGANISER, SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'gateId', type: 'string', format: 'uuid' })
  removeGate(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('gateId', ParseUUIDPipe) gateId: string,
  ) {
    return this.eventService.removeGate(eventId, gateId);
  }
}
