import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { FamilyMemberService } from './family-member.service';
import {
  CreateFamilyMemberDto,
  UpdateFamilyMemberDto,
} from './dto/family-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Family Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/family-members')
export class FamilyMemberController {
  constructor(private readonly familyMemberService: FamilyMemberService) {}

  @Get()
  @ApiOperation({ summary: 'Get all family members of the current user' })
  @ApiResponse({ status: 200, description: 'Family members list retrieved' })
  findAll(@CurrentUser('id') userId: string) {
    return this.familyMemberService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a family member' })
  @ApiResponse({ status: 201, description: 'Family member added' })
  @ApiResponse({ status: 400, description: 'Member limit reached' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFamilyMemberDto,
  ) {
    return this.familyMemberService.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific family member' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.familyMemberService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a family member' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    return this.familyMemberService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a family member' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.familyMemberService.remove(userId, id);
  }
}
