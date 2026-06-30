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
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  AssignTicketDto,
  ResolveTicketDto,
  AddCommentDto,
} from './dto/ticket.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { IsString } from 'class-validator';

class EscalateDto {
  @IsString()
  reason: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /** POST /tickets — create a ticket (auto-enriched with booking context) */
  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser('id') userId: string) {
    return this.ticketsService.create(dto, userId);
  }

  /** GET /tickets — list tickets with optional filters */
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.ticketsService.findAll({ status, category, assignedToId });
  }

  /** GET /tickets/:id — single ticket with comments preview */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  /** GET /tickets/:id/context — full booking + room + visitor context */
  @Get(':id/context')
  @Roles(Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TECHNICIAN, Role.SECRETARY)
  getContext(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.getContext(id);
  }

  /** GET /tickets/:id/comments — all public comments */
  @Get(':id/comments')
  getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeInternal') includeInternal?: string,
  ) {
    return this.ticketsService.getComments(id, includeInternal === 'true');
  }

  /** POST /tickets/:id/comments — add a comment */
  @Post(':id/comments')
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.addComment(id, dto, userId);
  }

  /** PATCH /tickets/:id — general update */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TECHNICIAN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  /** PATCH /tickets/:id/assign — assign to a team member */
  @Patch(':id/assign')
  @Roles(Role.ADMIN, Role.PM, Role.TEAM_LEAD)
  @HttpCode(HttpStatus.OK)
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.assign(id, dto, userId);
  }

  /** PATCH /tickets/:id/escalate — escalate to higher tier */
  @Patch(':id/escalate')
  @Roles(Role.ADMIN, Role.PM, Role.TEAM_LEAD)
  @HttpCode(HttpStatus.OK)
  escalate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EscalateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.escalate(id, dto.reason, userId);
  }

  /** PATCH /tickets/:id/resolve — mark as resolved with resolution note */
  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.resolve(id, dto, userId);
  }

  /** PATCH /tickets/:id/close — close a resolved ticket */
  @Patch(':id/close')
  @Roles(Role.ADMIN, Role.PM, Role.TEAM_LEAD)
  @HttpCode(HttpStatus.OK)
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.ticketsService.close(id, userId);
  }

  /** DELETE /tickets/:id — admin only hard delete  */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    // tickets don't get deleted — we close them
    return this.ticketsService.close(id, 'system');
  }
}
