import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { LeaveType } from '@prisma/client';
import { CreateLeaveRequestDto, ReviewLeaveRequestDto, InitLeaveBalanceDto } from './dto/leave.dto';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Employee submits a leave request */
  async requestLeave(employeeId: string, dto: CreateLeaveRequestDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('End date cannot be before start date');

    const daysRequested = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year: new Date().getFullYear(),
          leaveType: dto.type,
        },
      },
    });
    if (balance && balance.remainingDays < daysRequested) {
      throw new BadRequestException(
        `Insufficient ${dto.type} leave balance. Available: ${balance.remainingDays} days, Requested: ${daysRequested} days`,
      );
    }

    this.logger.log(`Leave request: ${dto.type} for ${daysRequested} day(s) by employee ${employeeId}`);
    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        type: dto.type,
        startDate: start,
        endDate: end,
        reason: dto.reason,
        status: 'PENDING',
      },
      include: { employee: { include: { user: { select: { name: true, email: true } } } } },
    });
  }

  /** HR officer / manager approves a leave request */
  async approveLeave(leaveId: string, approverId: string, dto?: ReviewLeaveRequestDto) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve a leave request with status: ${leave.status}`);
    }

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const daysApproved = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const [updated] = await this.prisma.$transaction([
      this.prisma.leaveRequest.update({
        where: { id: leaveId },
        data: { status: 'APPROVED', approverId, reviewNote: dto?.reviewNote },
      }),
      // Deduct from balance
      this.prisma.leaveBalance.updateMany({
        where: {
          employeeId: leave.employeeId,
          year: new Date().getFullYear(),
          leaveType: leave.type,
        },
        data: {
          usedDays: { increment: daysApproved },
          remainingDays: { decrement: daysApproved },
        },
      }),
    ]);

    this.logger.log(`Leave ${leaveId} approved by ${approverId}`);
    return updated;
  }

  /** HR officer / manager rejects a leave request */
  async rejectLeave(leaveId: string, approverId: string, dto?: ReviewLeaveRequestDto) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject a leave request with status: ${leave.status}`);
    }

    this.logger.log(`Leave ${leaveId} rejected by ${approverId}`);
    return this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: 'REJECTED', approverId, reviewNote: dto?.reviewNote },
    });
  }

  /** Employee cancels their own PENDING leave */
  async cancelLeave(leaveId: string, employeeId: string) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.employeeId !== employeeId) throw new ForbiddenException('You can only cancel your own leave requests');
    if (leave.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING leave requests can be cancelled');
    }
    return this.prisma.leaveRequest.update({ where: { id: leaveId }, data: { status: 'CANCELLED' } });
  }

  /** Get all leave requests (HR view) with optional filters */
  async findAll(employeeId?: string, status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
        approver: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get a single leave request */
  async findOne(id: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
        approver: { select: { name: true } },
      },
    });
    if (!leave) throw new NotFoundException('Leave request not found');
    return leave;
  }

  /** Initialize or update a leave balance for an employee */
  async initLeaveBalance(employeeId: string, dto: InitLeaveBalanceDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.leaveBalance.upsert({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year: dto.year,
          leaveType: dto.leaveType,
        },
      },
      create: {
        employeeId,
        year: dto.year,
        leaveType: dto.leaveType,
        totalDays: dto.totalDays,
        usedDays: 0,
        remainingDays: dto.totalDays,
      },
      update: {
        totalDays: dto.totalDays,
        remainingDays: dto.totalDays, // reset remaining on update
      },
    });
  }

  /** Get all leave balances for an employee */
  async getBalances(employeeId: string) {
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year: new Date().getFullYear() },
      orderBy: { leaveType: 'asc' },
    });
  }
}
