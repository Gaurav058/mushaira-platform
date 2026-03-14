import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  IsUrl,
  Min,
  IsEnum,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EventStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateEventDto {
  @ApiProperty({ example: 'uuid-of-organiser' })
  @IsString()
  @IsNotEmpty()
  organiser_id: string;

  @ApiProperty({ example: 'Annual Poetry Night 2025' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'A celebration of classical poetry and literary arts' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/poster.jpg' })
  @IsOptional()
  @IsUrl()
  poster?: string;

  @ApiProperty({ example: 'Siri Fort Auditorium, New Delhi' })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiProperty({ example: '2025-12-15T18:00:00.000Z' })
  @IsDateString()
  date_time: string;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?q=siri+fort+auditorium' })
  @IsOptional()
  @IsUrl()
  map_link?: string;

  @ApiPropertyOptional({ example: 'A grand evening celebrating classical poetry, music, and literary arts.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2025-11-01T00:00:00.000Z' })
  @IsDateString()
  registration_start: string;

  @ApiProperty({ example: '2025-12-10T23:59:59.000Z' })
  @IsDateString()
  registration_end: string;

  @ApiPropertyOptional({ default: true, description: 'Require organiser approval before confirming registrations' })
  @IsOptional()
  @IsBoolean()
  approval_required?: boolean;

  @ApiProperty({ example: 500, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  family_allowed?: boolean;
}

export class UpdateEventDto extends PartialType(
  OmitType(CreateEventDto, ['organiser_id'] as const),
) {}

export class ChangeEventStatusDto {
  @ApiProperty({ enum: EventStatus, description: 'Target status. Valid transitions: DRAFT→PUBLISHED, PUBLISHED→LIVE, PUBLISHED→CANCELLED, LIVE→COMPLETED, LIVE→CANCELLED' })
  @IsEnum(EventStatus)
  status: EventStatus;
}

export class EventQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organiser_id?: string;

  @ApiPropertyOptional({ description: 'Search by event title or venue' })
  @IsOptional()
  @IsString()
  search?: string;
}
