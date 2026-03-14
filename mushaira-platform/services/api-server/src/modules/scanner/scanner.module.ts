import { Module } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { QrPassModule } from '../qr-pass/qr-pass.module';

@Module({
  imports: [QrPassModule],
  controllers: [ScannerController],
  providers: [ScannerService],
})
export class ScannerModule {}
