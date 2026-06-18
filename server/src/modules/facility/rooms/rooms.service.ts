import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto) {
    return this.prisma.room.create({ data: createRoomDto });
  }

  async findAll() {
    return this.prisma.room.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { bookings: { orderBy: { date: 'desc' }, take: 5 } },
    });
    if (!room) throw new NotFoundException(`Room with id ${id} not found.`);
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    await this.findOne(id);
    return this.prisma.room.update({ where: { id }, data: updateRoomDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete by deactivating instead of physical deletion
    return this.prisma.room.update({ where: { id }, data: { isActive: false } });
  }
}
