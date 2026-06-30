import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { SlaMonitorService } from './sla-monitor.service';
import { SlaMonitorProcessor } from './sla-monitor.processor';
import { NotificationsModule } from '../../notifications/notifications.module';
import { DatabaseModule } from '../../../database/database.module';
import { SLA_MONITOR_QUEUE } from '../../../queue/queue.constants';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    BullModule.registerQueue({ name: SLA_MONITOR_QUEUE }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, SlaMonitorService, SlaMonitorProcessor],
  exports: [TicketsService],
})
export class TicketsModule {}

