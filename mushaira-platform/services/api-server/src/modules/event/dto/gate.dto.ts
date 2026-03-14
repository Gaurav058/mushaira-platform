import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateGateDto {
  @ApiProperty({ example: 'Main Entrance' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'GATE-A', description: 'Short unique code for this gate within the event (max 20 chars)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;
}

export class UpdateGateDto extends PartialType(CreateGateDto) {}
