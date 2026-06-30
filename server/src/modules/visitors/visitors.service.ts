import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VisitorStatus } from '@prisma/client';
import { CreateVisitorDto, CheckInVisitorDto, UpdateVisitorDto } from './dto/visitor.dto';

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Pre-register an expected visitor (from booking or receptionist) */
  async preRegister(dto: CreateVisitorDto) {
    this.logger.log(`Pre-registering visitor: ${dto.name}`);
    return this.prisma.visitor.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        hostId: dto.hostId,
        bookingId: dto.bookingId,
        isWalkIn: dto.isWalkIn ?? false,
        status: 'EXPECTED',
      },
      include: { host: { select: { id: true, name: true, email: true } } },
    });
  }

  /** Walk-in visitor: create + immediately check in + notify host */
  async walkIn(dto: CheckInVisitorDto) {
    if (!dto.hostId) throw new BadRequestException('hostId is required for walk-in');
    this.logger.log(`Walk-in visitor arriving for host: ${dto.hostId}`);

    const visitor = await this.prisma.visitor.create({
      data: {
        name: dto.name ?? 'Walk-in Visitor',
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        hostId: dto.hostId,
        bookingId: dto.bookingId,
        isWalkIn: true,
        status: 'CHECKED_IN',
        checkInTime: new Date(),
      },
      include: { host: { select: { id: true, name: true, email: true } } },
    });

    // Notify host immediately
    await this.notifyHost(visitor);
    return visitor;
  }

  /** Check in a pre-registered visitor and notify host */
  async checkIn(visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (visitor.status === 'CHECKED_IN') throw new BadRequestException('Visitor already checked in');
    if (visitor.status === 'CHECKED_OUT') throw new BadRequestException('Visitor has already checked out');
    if (visitor.status === 'CANCELLED') throw new BadRequestException('Visitor record has been cancelled');

    this.logger.log(`Checking in visitor: ${visitor.name}`);
    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: { status: 'CHECKED_IN', checkInTime: new Date() },
      include: {
        host: { select: { id: true, name: true, email: true } },
        booking: true,
      },
    });

    // Fire host notification
    await this.notifyHost(updated);
    return updated;
  }

  /** Check out a visitor */
  async checkOut(visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');

    const validCheckOutStatuses: VisitorStatus[] = ['CHECKED_IN', 'HOST_NOTIFIED', 'IN_MEETING'];
    if (!validCheckOutStatuses.includes(visitor.status)) {
      throw new BadRequestException(
        `Visitor must be checked in before checking out. Current status: ${visitor.status}`,
      );
    }

    this.logger.log(`Checking out visitor: ${visitor.name}`);
    return this.prisma.visitor.update({
      where: { id: visitorId },
      data: { status: 'CHECKED_OUT', checkOutTime: new Date() },
    });
  }

  /** Transition a visitor through status states */
  async updateStatus(visitorId: string, status: VisitorStatus) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');

    // Guard invalid transitions
    const allowedNext: Partial<Record<VisitorStatus, VisitorStatus[]>> = {
      EXPECTED: ['CHECKED_IN', 'CANCELLED'],
      CHECKED_IN: ['HOST_NOTIFIED', 'IN_MEETING', 'CHECKED_OUT', 'CANCELLED'],
      HOST_NOTIFIED: ['IN_MEETING', 'CHECKED_OUT', 'CANCELLED'],
      IN_MEETING: ['CHECKED_OUT'],
    };

    const nextAllowed = allowedNext[visitor.status];
    if (nextAllowed && !nextAllowed.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition: ${visitor.status} → ${status}. Allowed: ${nextAllowed.join(', ')}`,
      );
    }

    return this.prisma.visitor.update({ where: { id: visitorId }, data: { status } });
  }

  async findAll(status?: VisitorStatus) {
    return this.prisma.visitor.findMany({
      where: status ? { status } : undefined,
      include: {
        host: { select: { id: true, name: true, email: true } },
        booking: { select: { id: true, title: true, date: true, startTime: true, endTime: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByHost(hostId: string) {
    return this.prisma.visitor.findMany({
      where: { hostId },
      include: { booking: { select: { id: true, title: true, date: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, email: true } },
        booking: true,
        tickets: true,
      },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return visitor;
  }

  async update(id: string, dto: UpdateVisitorDto) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return this.prisma.visitor.update({ where: { id }, data: dto });
  }

  async cancel(id: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (['CHECKED_OUT', 'CANCELLED'].includes(visitor.status)) {
      throw new BadRequestException(`Cannot cancel a visitor with status: ${visitor.status}`);
    }
    return this.prisma.visitor.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async notifyHost(visitor: any) {
    try {
      if (visitor.host?.id) {
        await this.notifications.notifyVisitorArrived(
          visitor.host.id,
          visitor.name,
          visitor.company ?? null,
          visitor.id,
        );
      }
    } catch (err) {
      // Notification failure should never break the check-in flow
      this.logger.error(`Failed to send visitor arrival notification: ${(err as Error).message}`);
    }
  }
}
