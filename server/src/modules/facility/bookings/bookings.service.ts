import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ActivityService } from '../../activity/activity.service';
import { AiService } from '../../../ai/ai.service';
import { CreateBookingDto, UpdateBookingDto, ApproveBookingDto, RejectBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
    private readonly aiService: AiService,
  ) {}

  async create(createBookingDto: CreateBookingDto, createdById: string) {
    const room = await this.prisma.room.findUnique({ where: { id: createBookingDto.roomId } });
    if (!room || !room.isActive) throw new NotFoundException('Room not found or inactive.');

    const bookingDate = new Date(createBookingDto.date);
    const start = new Date(`${createBookingDto.date}T${createBookingDto.startTime}`);
    const end = new Date(`${createBookingDto.date}T${createBookingDto.endTime}`);

    if (end <= start) throw new BadRequestException('End time must be after start time.');

    // Conflict check (only against PENDING and APPROVED bookings)
    const conflict = await this.prisma.booking.findFirst({
      where: {
        roomId: createBookingDto.roomId,
        date: bookingDate,
        status: { in: ['PENDING', 'APPROVED'] },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
      include: { room: { select: { name: true } } },
    });

    if (conflict) {
      // Suggest alternatives
      const alternatives = await this.suggestAlternatives(
        createBookingDto.roomId,
        bookingDate,
        start,
        end,
        room.capacity,
      );

      throw new BadRequestException({
        message: 'Room is already booked for this time slot.',
        conflictingBookingId: conflict.id,
        alternatives,
      });
    }

    const booking = await this.prisma.booking.create({
      data: {
        title: createBookingDto.title,
        roomId: createBookingDto.roomId,
        createdById,
        date: bookingDate,
        startTime: start,
        endTime: end,
        notes: createBookingDto.notes,
        recurrence: createBookingDto.recurrence ?? 'NONE',
        recurrenceEndDate: createBookingDto.recurrenceEndDate
          ? new Date(createBookingDto.recurrenceEndDate)
          : undefined,
      },
      include: { room: true, createdBy: { select: { id: true, name: true, email: true } } },
    });

    await this.activityService.log({
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking.id,
      userId: createdById,
      metadata: { title: booking.title, room: room.name },
    });

    // Fire and forget no-show prediction to the AI queue
    await this.aiService.enqueueNoShowPrediction(booking.id);

    return booking;
  }

  /** Approve a pending booking (SECRETARY / ADMIN / FACILITY_MANAGER) */
  async approve(bookingId: string, approverId: string, dto?: ApproveBookingDto) {
    const booking = await this.findOne(bookingId);
    if (booking.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve a booking with status: ${booking.status}`);
    }

    this.logger.log(`Booking ${bookingId} approved by user ${approverId}`);
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'APPROVED',
        approvedById: approverId,
        notes: dto?.notes ?? booking.notes,
      },
      include: { room: true, createdBy: { select: { id: true, name: true, email: true } } },
    });

    await this.notificationsService.notifyBookingApproved(
      updatedBooking.createdById,
      updatedBooking.title,
      updatedBooking.id,
    );

    await this.activityService.log({
      action: 'BOOKING_APPROVED',
      entityType: 'Booking',
      entityId: updatedBooking.id,
      userId: approverId,
    });

    return updatedBooking;
  }

  /** Reject a pending booking with a reason */
  async reject(bookingId: string, approverId: string, dto: RejectBookingDto) {
    const booking = await this.findOne(bookingId);
    if (booking.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject a booking with status: ${booking.status}`);
    }

    this.logger.log(`Booking ${bookingId} rejected by user ${approverId}`);
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'REJECTED', rejectedReason: dto.reason },
      include: { room: true, createdBy: { select: { id: true, name: true, email: true } } },
    });

    await this.notificationsService.notifyBookingRejected(
      updatedBooking.createdById,
      updatedBooking.title,
      dto.reason,
      updatedBooking.id,
    );

    await this.activityService.log({
      action: 'BOOKING_REJECTED',
      entityType: 'Booking',
      entityId: updatedBooking.id,
      userId: approverId,
      metadata: { reason: dto.reason },
    });

    return updatedBooking;
  }


  /** Cancel a booking (requester or admin) */
  async cancel(bookingId: string, requesterId: string, isAdmin = false) {
    const booking = await this.findOne(bookingId);

    if (!isAdmin && booking.createdById !== requesterId) {
      throw new ForbiddenException('You can only cancel your own bookings.');
    }

    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel a booking with status: ${booking.status}`);
    }

    this.logger.log(`Booking ${bookingId} cancelled by user ${requesterId}`);
    const cancelledBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    await this.activityService.log({
      action: 'BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: cancelledBooking.id,
      userId: requesterId,
    });

    return cancelledBooking;
  }

  /** Mark booking as NO_SHOW (called by ghost-meeting heartbeat) */
  async markNoShow(bookingId: string) {
    this.logger.warn(`Marking booking ${bookingId} as NO_SHOW`);
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'NO_SHOW', noShowFlaggedAt: new Date() },
      include: { room: true },
    });

    await this.activityService.log({
      action: 'SYSTEM_AUTO_RELEASE',
      entityType: 'Booking',
      entityId: booking.id,
      metadata: { reason: 'GHOST_MEETING_DETECTED' },
    });

    // Notify organizer that room was released
    await this.notificationsService.create({
      userId: booking.createdById,
      type: 'BOOKING_NO_SHOW',
      title: 'Room Auto-Released (No-Show)',
      body: `Your booking for ${booking.room.name} has been released due to inactivity.`,
      metadata: { bookingId: booking.id },
    });

    return booking;
  }

  async findAll(status?: string) {
    return this.prisma.booking.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        room: { select: { id: true, name: true, location: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { createdById: userId },
      include: {
        room: { select: { id: true, name: true, location: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findForDay(dateStr: string) {
    const date = new Date(dateStr);
    const bookings = await this.prisma.booking.findMany({
      where: {
        date,
        status: { in: ['PENDING', 'APPROVED'] }
      },
      include: { room: true },
    });

    const booked = bookings.map(b => ({
      id: b.id,
      title: b.title,
      startAt: b.startTime.toISOString(),
      endAt: b.endTime.toISOString(),
      roomId: b.roomId,
      roomName: b.room?.name,
    }));

    return { booked };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        createdBy: { select: { id: true, name: true, email: true } },
        visitors: true,
        tickets: { select: { id: true, title: true, status: true, priority: true, category: true } },
      },
    });
    if (!booking) throw new NotFoundException(`Booking with id ${id} not found.`);
    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    await this.findOne(id);
    return this.prisma.booking.update({ where: { id }, data: updateBookingDto as any });
  }

  async remove(id: string) {
    return this.cancel(id, '', true);
  }

  /** Suggest available rooms in the same time slot with similar or greater capacity */
  private async suggestAlternatives(
    excludeRoomId: string,
    date: Date,
    start: Date,
    end: Date,
    minCapacity: number,
  ) {
    const busyRooms = await this.prisma.booking.findMany({
      where: {
        date,
        status: { in: ['PENDING', 'APPROVED'] },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
      select: { roomId: true },
    });

    const busyRoomIds = busyRooms.map((b) => b.roomId);
    busyRoomIds.push(excludeRoomId);

    return this.prisma.room.findMany({
      where: {
        isActive: true,
        id: { notIn: busyRoomIds },
        capacity: { gte: minCapacity },
      },
      select: { id: true, name: true, location: true, capacity: true },
      take: 5,
    });
  }
}
