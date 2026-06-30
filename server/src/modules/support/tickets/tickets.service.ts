import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ActivityService } from '../../activity/activity.service';
import { AiService } from '../../../ai/ai.service';
import { CreateTicketDto, UpdateTicketDto, AssignTicketDto, ResolveTicketDto, AddCommentDto } from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
    private readonly aiService: AiService,
  ) {}

  async create(dto: CreateTicketDto, createdById: string) {
    // If bookingId provided, auto-enrich with room context
    let enrichedRoomId = dto.roomId;
    let bookingContext: Record<string, any> = {};

    if (dto.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { room: true, createdBy: { select: { name: true } } },
      });
      if (booking) {
        enrichedRoomId = enrichedRoomId ?? booking.roomId;
        bookingContext = {
          bookingTitle: booking.title,
          roomName: booking.room.name,
          roomLocation: booking.room.location,
          bookingDate: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          organizer: booking.createdBy.name,
          bookingStatus: booking.status,
        };
      }
    }

    this.logger.log(`Creating ticket: "${dto.title}" [${dto.category}] by user ${createdById}`);

    const priority = dto.priority ?? 'MEDIUM';
    
    // SLA Engine: Lookup applicable rule (Category specific first, then fallback to priority-only)
    const rule = await this.prisma.slaRule.findFirst({
      where: {
        priority,
        isActive: true,
        OR: [{ category: dto.category }, { category: null }],
      },
      orderBy: { category: 'desc' }, // Category specific rule wins over null
    });

    let responseDueAt: Date | undefined;
    let resolutionDueAt: Date | undefined;

    if (rule) {
      const now = new Date();
      responseDueAt = new Date(now.getTime() + rule.responseMinutes * 60000);
      resolutionDueAt = new Date(now.getTime() + rule.resolutionMinutes * 60000);
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority,
        createdById,
        assignedToId: dto.assignedToId,
        bookingId: dto.bookingId,
        roomId: enrichedRoomId,
        visitorId: dto.visitorId,
        metadata: Object.keys(bookingContext).length ? bookingContext : undefined,
        responseDueAt,
        resolutionDueAt,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, name: true, location: true } },
        booking: { select: { id: true, title: true, date: true } },
      },
    });

    await this.activityService.log({
      action: 'TICKET_CREATED',
      entityType: 'Ticket',
      entityId: ticket.id,
      userId: createdById,
      metadata: { title: ticket.title, category: ticket.category },
    });

    // Enqueue an AI categorization request
    await this.aiService.enqueueTicketClassification(ticket.id, ticket.description);
    
    // Also enqueue priority suggestion
    await this.aiService.enqueueTicketPriority(ticket.id, ticket.category, ticket.description);

    return ticket;
  }

  /** Assign ticket to a technician/team member */
  async assign(ticketId: string, dto: AssignTicketDto, assignedById: string) {
    const ticket = await this.findOne(ticketId);
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new BadRequestException(`Cannot assign a ${ticket.status} ticket.`);
    }

    this.logger.log(`Ticket ${ticketId} assigned to ${dto.assignedToId} by ${assignedById}`);
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId: dto.assignedToId,
        status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await this.notificationsService.notifyTicketAssigned(
      dto.assignedToId,
      updatedTicket.title,
      updatedTicket.id,
    );

    await this.activityService.log({
      action: 'TICKET_ASSIGNED',
      entityType: 'Ticket',
      entityId: updatedTicket.id,
      userId: assignedById,
      metadata: { assignedToId: dto.assignedToId },
    });

    return updatedTicket;
  }

  /** Escalate a ticket */
  async escalate(ticketId: string, reason: string, escalatedById: string) {
    const ticket = await this.findOne(ticketId);
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new BadRequestException(`Cannot escalate a ${ticket.status} ticket.`);
    }

    this.logger.warn(`Ticket ${ticketId} escalated by ${escalatedById}: ${reason}`);
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'ESCALATED',
        metadata: {
          ...(ticket.metadata as object ?? {}),
          escalationReason: reason,
          escalatedAt: new Date().toISOString(),
          escalatedById,
        },
      },
    });

    if (updatedTicket.assignedToId) {
      await this.notificationsService.notifyTicketEscalated(
        updatedTicket.assignedToId,
        updatedTicket.title,
        updatedTicket.id,
      );
    }

    await this.activityService.log({
      action: 'TICKET_ESCALATED',
      entityType: 'Ticket',
      entityId: updatedTicket.id,
      userId: escalatedById,
      metadata: { reason },
    });

    return updatedTicket;
  }


  /** Resolve a ticket with a resolution note */
  async resolve(ticketId: string, dto: ResolveTicketDto, resolvedById: string) {
    const ticket = await this.findOne(ticketId);
    if (['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket.status)) {
      throw new BadRequestException(`Ticket is already ${ticket.status}.`);
    }

    this.logger.log(`Ticket ${ticketId} resolved by ${resolvedById}`);
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED', resolutionNote: dto.resolutionNote },
    });
  }

  /** Close a resolved ticket */
  async close(ticketId: string, closedById: string) {
    const ticket = await this.findOne(ticketId);
    if (ticket.status !== 'RESOLVED') {
      throw new BadRequestException('Only RESOLVED tickets can be closed.');
    }

    this.logger.log(`Ticket ${ticketId} closed by ${closedById}`);
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  /** Add a comment to a ticket */
  async addComment(ticketId: string, dto: AddCommentDto, authorId: string) {
    await this.findOne(ticketId); // validate exists
    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId,
        body: dto.body,
        isInternal: dto.isInternal ?? false,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
  }

  /** Get all comments for a ticket */
  async getComments(ticketId: string, includeInternal = false) {
    await this.findOne(ticketId);
    return this.prisma.ticketComment.findMany({
      where: {
        ticketId,
        ...(includeInternal ? {} : { isInternal: false }),
      },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Get full booking + room context for a ticket */
  async getContext(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        room: true,
        booking: {
          include: {
            room: true,
            createdBy: { select: { name: true, email: true } },
            visitors: { select: { id: true, name: true, company: true } },
          },
        },
        visitor: true,
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { name: true, role: true } } },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async findAll(filters?: { status?: string; category?: string; assignedToId?: string }) {
    return this.prisma.ticket.findMany({
      where: {
        ...(filters?.status ? { status: filters.status as any } : {}),
        ...(filters?.category ? { category: filters.category as any } : {}),
        ...(filters?.assignedToId ? { assignedToId: filters.assignedToId } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, name: true, location: true } },
        booking: { select: { id: true, title: true, date: true, startTime: true, endTime: true } },
        comments: { where: { isInternal: false }, take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket with id ${id} not found.`);
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto) {
    await this.findOne(id);
    return this.prisma.ticket.update({ where: { id }, data: dto as any });
  }

  async getRoomIncidentHistory(roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const tickets = await this.prisma.ticket.findMany({
      where: { roomId },
      include: {
        createdBy: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate by category
    const byCategory = tickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {});

    return {
      room: { id: room.id, name: room.name, location: room.location },
      totalIncidents: tickets.length,
      byCategory,
      recentTickets: tickets.slice(0, 10),
    };
  }
}
