import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { UpdateCompensationDto, AddPayrollAdjustmentDto, CreatePayrollPeriodDto } from './dto/payroll.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  /** PATCH /hr/payroll/:employeeId/compensation — set active compensation profile */
  @Patch(':employeeId/compensation')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  updateCompensation(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateCompensationDto,
  ) {
    return this.payrollService.updateCompensation(employeeId, dto);
  }

  /** POST /hr/payroll/:employeeId/adjustment — add a payroll adjustment */
  @Post(':employeeId/adjustment')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  addAdjustment(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: AddPayrollAdjustmentDto,
  ) {
    return this.payrollService.addAdjustment(employeeId, dto.payrollPeriodId, dto);
  }

  /** GET /hr/payroll/:employeeId/profile — full payroll profile */
  @Get(':employeeId/profile')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  getProfile(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.payrollService.getEmployeePayrollProfile(employeeId);
  }

  /** POST /hr/payroll/periods — create a payroll period */
  @Post('periods')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  createPeriod(@Body() dto: CreatePayrollPeriodDto) {
    return this.payrollService.createPeriod(dto);
  }

  /** GET /hr/payroll/periods — list all payroll periods */
  @Get('periods')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  listPeriods() {
    return this.payrollService.listPeriods();
  }
}
