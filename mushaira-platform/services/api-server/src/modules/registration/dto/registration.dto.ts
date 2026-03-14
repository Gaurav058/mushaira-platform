import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateRegistrationDto {
  @ApiPropertyOptional({ example: 'uuid-of-category', description: 'Category ID (General, VIP, etc.)' })
  @IsOptional()
  @IsString()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of family member UUIDs to include in this registration',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  family_member_ids?: string[];

  @ApiPropertyOptional({ example: 'Require wheelchair-accessible seating' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectRegistrationDto {
  @ApiPropertyOptional({ example: 'Registration closed for this category' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RegistrationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RegistrationStatus })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
