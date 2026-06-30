import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees';
import { PayrollModule } from './payroll';
import { LeaveModule } from './leave/leave.module';
import { ShiftsModule } from './shifts/shifts.module';

@Module({
  imports: [EmployeesModule, PayrollModule, LeaveModule, ShiftsModule],
  exports: [EmployeesModule, PayrollModule, LeaveModule, ShiftsModule],
})
export class HrModule {}
