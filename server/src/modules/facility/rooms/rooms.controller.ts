import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TicketsService } from '../../support/tickets/tickets.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly ticketsService: TicketsService,
  ) {}

  /** POST /rooms — create a new room */
  @Post()
  @Roles(Role.ADMIN, Role.PM)
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  /** GET /rooms — list all active rooms */
  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  /** GET /rooms/:id — single room with recent bookings */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.findOne(id);
  }

  /** GET /rooms/:id/incidents — incident history with category aggregation */
  @Get(':id/incidents')
  @Roles(Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.SECRETARY)
  getIncidentHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.getRoomIncidentHistory(id);
  }

  /** PATCH /rooms/:id — update room details */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.PM)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  /** PATCH /rooms/:id/deactivate — soft-delete a room */
  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.remove(id);
  }

  /** DELETE /rooms/:id — soft delete (deactivate) */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.remove(id);
  }
}
