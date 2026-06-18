import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SensorsService } from './sensors.service';
import { UpdateSensorDto } from './dto/sensor-data.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Sensors')
@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update sensor state (Real-time)' })
  // In production, this might be called by an IoT Gateway or Webhook
  updateState(@Body() dto: UpdateSensorDto) {
    return this.sensorsService.updateSensorState(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('state/:sensorId')
  @Roles(Role.ADMIN, Role.PM, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Get the latest state of a specific sensor' })
  getState(@Param('sensorId') sensorId: string) {
    return this.sensorsService.getSensorState(sensorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('states')
  @Roles(Role.ADMIN, Role.PM)
  @ApiOperation({ summary: 'Get all active sensor states in the facility' })
  getAllStates() {
    return this.sensorsService.getAllSensorStates();
  }
}
