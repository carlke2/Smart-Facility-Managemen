import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto, ReviewLeaveRequestDto, InitLeaveBalanceDto } from './dto/leave.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  /** POST /hr/leave/:employeeId — employee submits a leave request */
  @Post(':employeeId')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.TEAM_LEAD, Role.DEVELOPER, Role.TECHNICIAN, Role.SECRETARY, Role.PM)
  requestLeave(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.leaveService.requestLeave(employeeId, dto);
  }

  /** GET /hr/leave — all leave requests (HR view) */
  @Get()
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.leaveService.findAll(employeeId, status);
  }

  /** GET /hr/leave/:id — single leave request */
  @Get(':id')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveService.findOne(id);
  }

  /** PATCH /hr/leave/:id/approve — approve a leave request */
  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  @HttpCode(HttpStatus.OK)
  approveLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLeaveRequestDto,
    @Request() req: any,
  ) {
    return this.leaveService.approveLeave(id, req.user.id, dto);
  }

  /** PATCH /hr/leave/:id/reject — reject a leave request */
  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  @HttpCode(HttpStatus.OK)
  rejectLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLeaveRequestDto,
    @Request() req: any,
  ) {
    return this.leaveService.rejectLeave(id, req.user.id, dto);
  }

  /** PATCH /hr/leave/:id/cancel — employee cancels their own pending leave */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.leaveService.cancelLeave(id, employeeId);
  }

  /** POST /hr/leave/balance/:employeeId — initialize/set a leave balance */
  @Post('balance/:employeeId')
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  initBalance(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: InitLeaveBalanceDto,
  ) {
    return this.leaveService.initLeaveBalance(employeeId, dto);
  }

  /** GET /hr/leave/balance/:employeeId — get all leave balances for an employee */
  @Get('balance/:employeeId')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.PM, Role.TEAM_LEAD)
  getBalances(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.leaveService.getBalances(employeeId);
  }
}
