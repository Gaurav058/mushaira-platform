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
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrganiserService } from './organiser.service';
import {
  CreateOrganiserDto,
  UpdateOrganiserDto,
  OrganiserQueryDto,
} from './dto/organiser.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Organisers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('organisers')
export class OrganiserController {
  constructor(private readonly organiserService: OrganiserService) {}

  @Get('stats/platform')
  @ApiOperation({ summary: 'Get platform-wide statistics [SUPER_ADMIN]' })
  getPlatformStats() {
    return this.organiserService.getPlatformStats();
  }

  @Get()
  @ApiOperation({ summary: 'List all organisers [SUPER_ADMIN]' })
  findAll(@Query() query: OrganiserQueryDto) {
    return this.organiserService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organiser details [SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organiserService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organiser [SUPER_ADMIN]' })
  create(@Body() dto: CreateOrganiserDto) {
    return this.organiserService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organiser details [SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganiserDto,
  ) {
    return this.organiserService.update(id, dto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle organiser active status [SUPER_ADMIN]' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.organiserService.toggleStatus(id);
  }
}
