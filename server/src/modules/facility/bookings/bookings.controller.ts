import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingDto, ApproveBookingDto, RejectBookingDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** POST /bookings — create a new booking (checks conflicts, suggests alternatives) */
  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @CurrentUser('id') userId: string) {
    return this.bookingsService.create(createBookingDto, userId);
  }

  /** GET /bookings — list all bookings, optionally filtered by status */
  @Get()
  findAll(@Query('status') status?: string) {
    return this.bookingsService.findAll(status);
  }

  /** GET /bookings/:id — single booking detail with visitors + tickets */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findOne(id);
  }

  /** PATCH /bookings/:id — update booking fields */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.PM, Role.SECRETARY)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  /** PATCH /bookings/:id/approve — approve a pending booking */
  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.SECRETARY, Role.PM)
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.approve(id, userId, dto);
  }

  /** PATCH /bookings/:id/reject — reject a pending booking */
  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.SECRETARY, Role.PM)
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.reject(id, userId, dto);
  }

  /** PATCH /bookings/:id/cancel — cancel a booking */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string, @Request() req: any) {
    const isAdmin = [Role.ADMIN, Role.PM, Role.SECRETARY].includes(req.user.role);
    return this.bookingsService.cancel(id, userId, isAdmin);
  }

  /** DELETE /bookings/:id — hard cancel (admin only) */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.bookingsService.cancel(id, userId, true);
  }
}
