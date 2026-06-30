import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { LeaveService } from '../leave/leave.service';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leaveService: LeaveService,
  ) {}

  /** Onboarding: creates the employee record and links to a system user */
  async onboardEmployee(userId: string, orgId: string, data: any) {
    this.logger.log(`Onboarding new employee for user: ${userId}`);

    // Strip DTO-only fields before passing to Prisma
    const { organizationId: _org, ...rest } = data;

    const employee = await this.prisma.employee.create({
      data: {
        userId,
        organizationId: orgId,
        joiningDate: rest.joiningDate ? new Date(rest.joiningDate) : new Date(),
        ...rest,
      },
      include: { user: { select: { name: true, email: true, role: true } } },
    });

    // Auto-init annual leave balance for the current year
    const currentYear = new Date().getFullYear();
    await this.leaveService.initLeaveBalance(employee.id, {
      year: currentYear,
      leaveType: 'ANNUAL',
      totalDays: 20, // Standard starting allocation
    });

    return employee;
  }


  /** Offboarding: marks EXITED and revokes system login */
  async offboardEmployee(employeeId: string) {
    this.logger.log(`Offboarding employee: ${employeeId}`);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.$transaction([
      this.prisma.employee.update({
        where: { id: employeeId },
        data: { status: 'EXITED', terminationDate: new Date() },
      }),
      this.prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      }),
    ]);
  }

  /** Update employee assignment details (dept, team, designation, etc.) */
  async update(id: string, data: any) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.employee.update({
      where: { id },
      data,
      include: { user: { select: { name: true, email: true } }, designation: true, department: true },
    });
  }

  /** All employees list (HR overview) */
  async findAll() {
    return this.prisma.employee.findMany({
      include: {
        user: { select: { name: true, email: true, role: true, isActive: true } },
        designation: true,
        department: true,
        team: true,
        site: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Single employee full profile */
  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, role: true, isActive: true } },
        designation: true,
        department: true,
        team: true,
        site: true,
        organization: true,
        compensationProfiles: { where: { isActive: true } },
        bankDetails: true,
        leaveBalances: { where: { year: new Date().getFullYear() } },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }
}
