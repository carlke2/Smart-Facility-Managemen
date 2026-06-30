import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { DatabaseModule } from '../../../database/database.module';
import { LeaveModule } from '../leave/leave.module';

@Module({
  imports: [DatabaseModule, LeaveModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
