import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees/employees.module';
import { PayrollModule } from './payroll/payroll.module';
import { LeaveModule } from './leave/leave.module';

@Module({
  imports: [EmployeesModule, PayrollModule, LeaveModule],
  exports: [EmployeesModule, PayrollModule, LeaveModule],
})
export class HrModule {}
