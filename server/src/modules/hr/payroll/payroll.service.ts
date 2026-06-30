import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Sets a new active Compensation Profile, deactivating any previous one */
  async updateCompensation(employeeId: string, data: any) {
    this.logger.log(`Updating compensation profile for employee: ${employeeId}`);

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    await this.prisma.compensationProfile.updateMany({
      where: { employeeId, isActive: true },
      data: { isActive: false },
    });

    return this.prisma.compensationProfile.create({
      data: { employeeId, ...data },
    });
  }

  /** Adds a Payroll Adjustment (Bonus / Deduction / Arrears / Loan Repayment) */
  async addAdjustment(employeeId: string, periodId: string, data: any) {
    this.logger.log(`Adding ${data.type} adjustment for employee: ${employeeId}`);

    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.isClosed) throw new Error('Cannot add adjustments to a closed payroll period');

    return this.prisma.payrollAdjustment.create({
      data: { employeeId, payrollPeriodId: periodId, ...data },
      include: { payrollPeriod: true },
    });
  }

  /** Full payroll profile: active compensation + bank details + adjustments */
  async getEmployeePayrollProfile(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: { select: { name: true, email: true } },
        bankDetails: true,
        compensationProfiles: { where: { isActive: true } },
        adjustments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { payrollPeriod: true },
        },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  /** Create a payroll period (e.g. "June 2026") */
  async createPeriod(data: { name: string; startDate: string; endDate: string }) {
    return this.prisma.payrollPeriod.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isClosed: false,
      },
    });
  }

  /** List all payroll periods, newest first */
  async listPeriods() {
    return this.prisma.payrollPeriod.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { adjustments: true } },
      },
    });
  }

  /** Close a payroll period (no more adjustments allowed) */
  async closePeriod(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    return this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { isClosed: true },
    });
  }
}
