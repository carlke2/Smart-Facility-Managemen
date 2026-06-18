import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Onboarding Flow (Phase 1 Readiness)
   * Creates the employee record and links it to a system user.
   */
  async onboardEmployee(userId: string, orgId: string, data: any) {
    this.logger.log(`Onboarding new employee for user: ${userId}`);
    
    return this.prisma.employee.create({
      data: {
        userId,
        organizationId: orgId,
        ...data,
      },
    });
  }

  /**
   * Offboarding Flow (Phase 1 Readiness)
   * Sets termination date and revokes system access.
   */
  async offboardEmployee(employeeId: string) {
    this.logger.log(`Offboarding employee: ${employeeId}`);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.$transaction([
      // 1. Mark as EXITED
      this.prisma.employee.update({
        where: { id: employeeId },
        data: { status: 'EXITED', terminationDate: new Date() },
      }),
      // 2. Revoke system access
      this.prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      }),
    ]);
  }

  async findAll() {
    return this.prisma.employee.findMany({
      include: { user: true, designation: true, department: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { 
        user: true, 
        designation: true, 
        department: true,
        compensationProfiles: true,
        bankDetails: true,
      },
    });
  }
}
