import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiGatewayController {
  constructor(private readonly aiGatewayService: AiGatewayService) {}

  @Get('no-show/:bookingId')
  @Roles(Role.ADMIN, Role.PM, Role.SECRETARY)
  predictNoShow(@Param('bookingId') bookingId: string) {
    return this.aiGatewayService.predictNoShow(bookingId);
  }

  @Get('room-demand/:roomId')
  @Roles(Role.ADMIN, Role.PM)
  forecastDemand(@Param('roomId') roomId: string) {
    return this.aiGatewayService.forecastRoomDemand(roomId);
  }
}
