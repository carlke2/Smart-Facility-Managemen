import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create a new shift for an employee */
  async create(dto: CreateShiftDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { user: { select: { name: true } } },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const shiftDate = new Date(dto.date);
    // Build full DateTime strings for the time fields
    const start = new Date(`${dto.date}T${dto.startTime}:00`);
    const end = new Date(`${dto.date}T${dto.endTime}:00`);

    if (end <= start) {
      throw new BadRequestException('Shift end time must be after start time');
    }

    // Overlap check for the same employee on the same day
    const overlap = await this.prisma.shift.findFirst({
      where: {
        employeeId: dto.employeeId,
        date: shiftDate,
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
    });
    if (overlap) {
      throw new BadRequestException(
        `This employee already has a shift overlapping this time window on ${dto.date}`,
      );
    }

    this.logger.log(`Creating ${dto.type} shift for employee ${dto.employeeId} on ${dto.date}`);
    return this.prisma.shift.create({
      data: {
        employeeId: dto.employeeId,
        type: dto.type,
        date: shiftDate,
        startTime: start,
        endTime: end,
        notes: dto.notes,
      },
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
      },
    });
  }

  /** Get all shifts for a specific employee */
  async findByEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.shift.findMany({
      where: { employeeId },
      include: {
        employee: { include: { user: { select: { name: true } } } },
      },
      orderBy: { date: 'asc' },
    });
  }

  /** Get all shifts for a given week (Monday as start date) */
  async findByWeek(weekStart: string) {
    const start = new Date(weekStart);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid weekStart date — use ISO format e.g. 2026-06-30');
    }

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.prisma.shift.findMany({
      where: { date: { gte: start, lt: end } },
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  /** All shifts across the organization */
  async findAll() {
    return this.prisma.shift.findMany({
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async update(id: string, dto: UpdateShiftDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.startTime) data.startTime = new Date(`1970-01-01T${dto.startTime}:00`);
    if (dto.endTime) data.endTime = new Date(`1970-01-01T${dto.endTime}:00`);
    return this.prisma.shift.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.shift.delete({ where: { id } });
    return { message: 'Shift removed successfully' };
  }
}
