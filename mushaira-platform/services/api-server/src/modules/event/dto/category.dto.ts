import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'VIP' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'VIP seating with backstage access' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#C0392B', description: 'Hex color code for UI display' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex code (e.g. #C0392B)' })
  color?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
