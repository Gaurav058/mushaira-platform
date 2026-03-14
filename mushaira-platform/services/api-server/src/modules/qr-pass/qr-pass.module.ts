import { Module } from '@nestjs/common';
import { QrPassService } from './qr-pass.service';

@Module({
  providers: [QrPassService],
  exports: [QrPassService],
})
export class QrPassModule {}
