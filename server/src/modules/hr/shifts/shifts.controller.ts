import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  /** POST /hr/shifts — create a new shift */
  @Post()
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  create(@Body() dto: CreateShiftDto) {
    return this.shiftsService.create(dto);
  }

  /** GET /hr/shifts — all shifts */
  @Get()
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  findAll() {
    return this.shiftsService.findAll();
  }

  /** GET /hr/shifts/week?weekStart=2026-06-30 — weekly roster view */
  @Get('week')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  findByWeek(@Query('weekStart') weekStart: string) {
    return this.shiftsService.findByWeek(weekStart);
  }

  /** GET /hr/shifts/employee/:employeeId — all shifts for one employee */
  @Get('employee/:employeeId')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  findByEmployee(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.shiftsService.findByEmployee(employeeId);
  }

  /** GET /hr/shifts/:id — single shift */
  @Get(':id')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftsService.findOne(id);
  }

  /** PATCH /hr/shifts/:id — update a shift */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftsService.update(id, dto);
  }

  /** DELETE /hr/shifts/:id — remove a shift */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftsService.remove(id);
  }
}
