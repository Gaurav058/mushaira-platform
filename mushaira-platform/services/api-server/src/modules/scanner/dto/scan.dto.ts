import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanQrDto {
  @ApiProperty({
    example: 'a3f7c291-5e8a-4b2d-9f6e-0d1c7a3e8b5f',
    description: 'The QR code value decoded from the attendee pass',
  })
  @IsString()
  @IsNotEmpty()
  qr_code: string;

  @ApiProperty({ example: 'uuid-of-gate', description: 'Gate ID where the scan is occurring' })
  @IsUUID()
  gate_id: string;
}
