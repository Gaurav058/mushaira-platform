import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateOrganiserDto {
  @ApiProperty({ example: 'Jashn-e-Urdu' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@jashneurdu.org' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919000000000' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiPropertyOptional({ example: 'https://jashneurdu.org' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ example: 'An organization dedicated to celebrating classical poetry and literary arts.' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateOrganiserDto extends PartialType(CreateOrganiserDto) {}

export class OrganiserQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
