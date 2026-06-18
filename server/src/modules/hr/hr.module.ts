import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees';
import { PayrollModule } from './payroll';
import { LeaveModule } from './leave/leave.module';


@Module({
  imports: [EmployeesModule, PayrollModule, LeaveModule],
  exports: [EmployeesModule, PayrollModule, LeaveModule],
})
export class HrModule {}


