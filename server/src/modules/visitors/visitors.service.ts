import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { VisitorStatus } from '@prisma/client';
import { CreateVisitorDto, CheckInVisitorDto, UpdateVisitorDto } from './dto/visitor.dto';

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  /** Walk-in visitor: create + immediately check in */
  async walkIn(dto: CheckInVisitorDto) {
    if (!dto.hostId) throw new BadRequestException('hostId is required for walk-in');
    this.logger.log(`Walk-in visitor arriving for host: ${dto.hostId}`);
    return this.prisma.visitor.create({
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
  }

  /** Check in a pre-registered visitor */
  async checkIn(visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (visitor.status === 'CHECKED_IN') throw new BadRequestException('Visitor already checked in');
    if (visitor.status === 'CHECKED_OUT') throw new BadRequestException('Visitor has already checked out');

    this.logger.log(`Checking in visitor: ${visitor.name}`);
    return this.prisma.visitor.update({
      where: { id: visitorId },
      data: { status: 'CHECKED_IN', checkInTime: new Date() },
      include: { host: { select: { id: true, name: true, email: true } }, booking: true },
    });
  }

  /** Check out a visitor */
  async checkOut(visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (visitor.status !== 'CHECKED_IN' && visitor.status !== 'HOST_NOTIFIED' && visitor.status !== 'IN_MEETING') {
      throw new BadRequestException('Visitor must be checked in before checking out');
    }

    this.logger.log(`Checking out visitor: ${visitor.name}`);
    return this.prisma.visitor.update({
      where: { id: visitorId },
      data: { status: 'CHECKED_OUT', checkOutTime: new Date() },
    });
  }

  /** Update visitor status (e.g. HOST_NOTIFIED → IN_MEETING) */
  async updateStatus(visitorId: string, status: VisitorStatus) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return this.prisma.visitor.update({ where: { id: visitorId }, data: { status } });
  }

  /** Find all visitors (admin / receptionist view) */
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

  /** Find visitors by host */
  async findByHost(hostId: string) {
    return this.prisma.visitor.findMany({
      where: { hostId },
      include: { booking: { select: { id: true, title: true, date: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Find a single visitor */
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

  /** Update visitor details */
  async update(id: string, dto: UpdateVisitorDto) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return this.prisma.visitor.update({ where: { id }, data: dto });
  }

  /** Cancel a visitor record */
  async cancel(id: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return this.prisma.visitor.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
