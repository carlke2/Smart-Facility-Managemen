import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sets up a Compensation Profile (Payroll Readiness)
   */
  async updateCompensation(employeeId: string, data: any) {
    this.logger.log(`Updating compensation profile for employee: ${employeeId}`);

    // Deactivate old profiles before creating a new one
    await this.prisma.compensationProfile.updateMany({
      where: { employeeId, isActive: true },
      data: { isActive: false },
    });

    return this.prisma.compensationProfile.create({
      data: {
        employeeId,
        ...data,
      },
    });
  }

  /**
   * Adds a Payroll Adjustment (Bonus/Deduction/Arrears)
   */
  async addAdjustment(employeeId: string, periodId: string, data: any) {
    this.logger.log(`Adding ${data.type} adjustment for employee: ${employeeId}`);

    return this.prisma.payrollAdjustment.create({
      data: {
        employeeId,
        payrollPeriodId: periodId,
        ...data,
      },
    });
  }

  /**
   * Fetches the current financial profile for an employee
   */
  async getEmployeePayrollProfile(employeeId: string) {
    return this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        bankDetails: true,
        compensationProfiles: {
          where: { isActive: true },
        },
        adjustments: true, // We'll need to link this in schema or fetch separately
      },
    });
  }
}
