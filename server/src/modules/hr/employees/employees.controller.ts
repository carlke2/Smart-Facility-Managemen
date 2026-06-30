import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { OnboardEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  /** POST /hr/employees/onboard — onboard a new employee */
  @Post('onboard')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  onboard(@Body() dto: OnboardEmployeeDto) {
    return this.employeesService.onboardEmployee(dto.userId, dto.organizationId, dto);
  }

  /** GET /hr/employees — all employees with department/designation */
  @Get()
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  findAll() {
    return this.employeesService.findAll();
  }

  /** GET /hr/employees/:id — single employee full profile */
  @Get(':id')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  /** PATCH /hr/employees/:id — update employee details */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, dto);
  }

  /** PATCH /hr/employees/:id/offboard — offboard (exits + revokes access) */
  @Patch(':id/offboard')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  offboard(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.offboardEmployee(id);
  }
}
