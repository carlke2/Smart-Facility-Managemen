import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto, createdById: string) {
    const room = await this.prisma.room.findUnique({ where: { id: createBookingDto.roomId } });
    if (!room || !room.isActive) throw new NotFoundException('Room not found or inactive.');

    const bookingDate = new Date(createBookingDto.date);
    const start = new Date(`${createBookingDto.date}T${createBookingDto.startTime}`);
    const end = new Date(`${createBookingDto.date}T${createBookingDto.endTime}`);

    if (end <= start) throw new BadRequestException('End time must be after start time.');

    // Conflict check
    const conflict = await this.prisma.booking.findFirst({
      where: {
        roomId: createBookingDto.roomId,
        date: bookingDate,
        status: { in: ['PENDING', 'APPROVED'] },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });
    if (conflict) throw new BadRequestException('Room is already booked for this time slot.');

    return this.prisma.booking.create({
      data: {
        title: createBookingDto.title,
        roomId: createBookingDto.roomId,
        createdById,
        date: bookingDate,
        startTime: start,
        endTime: end,
        notes: createBookingDto.notes,
      },
      include: { room: true, createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        room: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        createdBy: { select: { id: true, name: true, email: true } },
        visitors: true,
        tickets: true,
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
    await this.findOne(id);
    return this.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
