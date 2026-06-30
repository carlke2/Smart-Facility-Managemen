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
} from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto, CheckInVisitorDto, UpdateVisitorDto } from './dto/visitor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, VisitorStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  /** POST /visitors — pre-register an expected visitor */
  @Post()
  @Roles(Role.ADMIN, Role.SECRETARY, Role.PM, Role.TEAM_LEAD)
  preRegister(@Body() dto: CreateVisitorDto) {
    return this.visitorsService.preRegister(dto);
  }

  /** POST /visitors/walk-in — immediate walk-in check-in */
  @Post('walk-in')
  @Roles(Role.ADMIN, Role.SECRETARY)
  walkIn(@Body() dto: CheckInVisitorDto) {
    return this.visitorsService.walkIn(dto);
  }

  /** GET /visitors — all visitors, optionally filtered by status */
  @Get()
  @Roles(Role.ADMIN, Role.SECRETARY, Role.PM)
  findAll(@Query('status') status?: VisitorStatus) {
    return this.visitorsService.findAll(status);
  }

  /** GET /visitors/host/:hostId — visitor list for a specific host */
  @Get('host/:hostId')
  @Roles(Role.ADMIN, Role.SECRETARY, Role.PM, Role.TEAM_LEAD, Role.DEVELOPER, Role.TECHNICIAN)
  findByHost(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.visitorsService.findByHost(hostId);
  }

  /** GET /visitors/:id — single visitor detail */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SECRETARY, Role.PM)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.findOne(id);
  }

  /** PATCH /visitors/:id — update visitor details */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SECRETARY)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVisitorDto) {
    return this.visitorsService.update(id, dto);
  }

  /** PATCH /visitors/:id/check-in — check in a pre-registered visitor */
  @Patch(':id/check-in')
  @Roles(Role.ADMIN, Role.SECRETARY)
  @HttpCode(HttpStatus.OK)
  checkIn(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.checkIn(id);
  }

  /** PATCH /visitors/:id/check-out — check out a visitor */
  @Patch(':id/check-out')
  @Roles(Role.ADMIN, Role.SECRETARY)
  @HttpCode(HttpStatus.OK)
  checkOut(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.checkOut(id);
  }

  /** PATCH /visitors/:id/cancel — cancel a visitor record */
  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.SECRETARY)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.cancel(id);
  }
}
