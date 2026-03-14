import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { RegistrationStatus, ScanResult } from '@prisma/client';
import { isAfter } from 'date-fns';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QrPassService } from '../qr-pass/qr-pass.service';
import { ScanQrDto } from './dto/scan.dto';
import { IScanResponse } from '@mushaira/shared-types';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private prisma: PrismaService,
    private qrPassService: QrPassService,
  ) {}

  async scan(dto: ScanQrDto, scannerId: string): Promise<IScanResponse> {
    const { qr_code, gate_id } = dto;

    const pass = await this.prisma.qRPass.findUnique({
      where: { qr_code },
      include: {
        registration: {
          include: {
            user: { select: { id: true, full_name: true, mobile_number: true } },
            event: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!pass) {
      await this.logEntry({
        qr_pass_id: null,
        gate_id,
        scanned_by: scannerId,
        result: ScanResult.INVALID_QR,
        user_id: null,
      });
      return { result: ScanResult.INVALID_QR, message: 'Invalid QR code' };
    }

    // Verify HMAC signature
    const hashValid = this.qrPassService.verifyHash(
      pass.event_id,
      pass.registration_id,
      pass.qr_code,
      pass.secure_hash,
    );

    if (!hashValid) {
      return { result: ScanResult.INVALID_QR, message: 'QR code signature verification failed' };
    }

    // Check gate belongs to same event
    const gate = await this.prisma.gate.findUnique({ where: { id: gate_id } });

    if (!gate || !gate.is_active || gate.event_id !== pass.event_id) {
      await this.logEntry({
        qr_pass_id: pass.id,
        gate_id,
        scanned_by: scannerId,
        result: ScanResult.WRONG_GATE,
        user_id: pass.registration.user_id,
      });
      return {
        result: ScanResult.WRONG_GATE,
        message: 'This gate does not belong to the event on the pass',
      };
    }

    // Check expiry
    if (pass.expires_at && isAfter(new Date(), pass.expires_at)) {
      await this.logEntry({
        qr_pass_id: pass.id,
        gate_id,
        scanned_by: scannerId,
        result: ScanResult.EXPIRED,
        user_id: pass.registration.user_id,
      });
      return { result: ScanResult.EXPIRED, message: 'QR pass has expired' };
    }

    // Check registration status
    if (pass.registration.status === RegistrationStatus.REJECTED) {
      await this.logEntry({
        qr_pass_id: pass.id,
        gate_id,
        scanned_by: scannerId,
        result: ScanResult.REJECTED_REGISTRATION,
        user_id: pass.registration.user_id,
      });
      return {
        result: ScanResult.REJECTED_REGISTRATION,
        message: 'This registration has been rejected',
      };
    }

    // Check already scanned using an atomic update to prevent race conditions
    const atomicUpdate = await this.prisma.qRPass.updateMany({
      where: { id: pass.id, is_used: false },
      data: { is_used: true, used_at: new Date() },
    });

    if (atomicUpdate.count === 0) {
      await this.logEntry({
        qr_pass_id: pass.id,
        gate_id,
        scanned_by: scannerId,
        result: ScanResult.ALREADY_SCANNED,
        user_id: pass.registration.user_id,
      });
      return {
        result: ScanResult.ALREADY_SCANNED,
        message: 'This QR pass has already been used for entry',
        attendee_name: pass.registration.user.full_name ?? pass.registration.user.mobile_number,
        event_title: pass.registration.event.title,
      };
    }

    // Mark registration as checked in
    await this.prisma.eventRegistration.update({
      where: { id: pass.registration_id },
      data: { status: RegistrationStatus.CHECKED_IN },
    });

    await this.logEntry({
      qr_pass_id: pass.id,
      gate_id,
      scanned_by: scannerId,
      result: ScanResult.SUCCESS,
      user_id: pass.registration.user_id,
    });

    const attendeeName =
      pass.registration.user.full_name ?? pass.registration.user.mobile_number;

    this.logger.log(
      `Entry granted — attendee: ${attendeeName}, gate: ${gate.name}, event: ${pass.registration.event.title}`,
    );

    return {
      result: ScanResult.SUCCESS,
      message: 'Entry approved',
      attendee_name: attendeeName,
      event_title: pass.registration.event.title,
      gate_name: gate.name,
      checked_in_at: new Date(),
    };
  }

  async getGateStats(gateId: string) {
    const gate = await this.prisma.gate.findUnique({
      where: { id: gateId },
      include: { event: { select: { id: true, title: true, capacity: true } } },
    });

    if (!gate) {
      throw new NotFoundException('Gate not found');
    }

    const [totalScans, successScans, failedScans] = await this.prisma.$transaction([
      this.prisma.entryLog.count({ where: { gate_id: gateId } }),
      this.prisma.entryLog.count({
        where: { gate_id: gateId, result: ScanResult.SUCCESS },
      }),
      this.prisma.entryLog.count({
        where: {
          gate_id: gateId,
          result: { not: ScanResult.SUCCESS },
        },
      }),
    ]);

    const checkedIn = await this.prisma.eventRegistration.count({
      where: {
        event_id: gate.event_id,
        status: RegistrationStatus.CHECKED_IN,
      },
    });

    return {
      gate: { id: gate.id, name: gate.name, code: gate.code },
      event: gate.event,
      stats: {
        total_scans: totalScans,
        successful_entries: successScans,
        failed_attempts: failedScans,
        checked_in_total: checkedIn,
        capacity: gate.event.capacity,
        fill_percentage: Math.round((checkedIn / gate.event.capacity) * 100),
      },
    };
  }

  async getEventEntryLogs(eventId: string, page = 1, limit = 50) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.entryLog.findMany({
        where: { gate: { event_id: eventId } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scanned_at: 'desc' },
        include: {
          gate: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, full_name: true, mobile_number: true } },
        },
      }),
      this.prisma.entryLog.count({ where: { gate: { event_id: eventId } } }),
    ]);

    return {
      items: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async logEntry(params: {
    qr_pass_id: string | null;
    gate_id: string;
    scanned_by: string;
    result: ScanResult;
    user_id: string | null;
    notes?: string;
  }) {
    if (!params.qr_pass_id) return;

    await this.prisma.entryLog.create({
      data: {
        qr_pass_id: params.qr_pass_id,
        gate_id: params.gate_id,
        scanned_by: params.scanned_by,
        result: params.result,
        user_id: params.user_id,
        notes: params.notes,
      },
    });
  }
}
