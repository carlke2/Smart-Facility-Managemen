import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTicketDto, UpdateTicketDto } from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto, createdById: string) {
    return this.prisma.ticket.create({
      data: { ...createTicketDto, createdById },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        room: true,
        booking: true,
      },
    });
  }

  async findAll() {
    return this.prisma.ticket.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        room: true,
        booking: true,
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
        room: true,
        booking: true,
        visitor: true,
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket with id ${id} not found.`);
    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    await this.findOne(id);
    return this.prisma.ticket.update({ where: { id }, data: updateTicketDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ticket.update({ where: { id }, data: { status: 'CLOSED' } });
  }
}
