import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';
import { GhostMeetingService } from './ghost-meeting.service';
import { GhostMeetingProcessor } from './ghost-meeting.processor';
import { DatabaseModule } from '../../database/database.module';
import { GHOST_MEETING_QUEUE } from '../../queue/queue.constants';

/**
 * FacilityModule — Domain A: Facility / Meeting Intelligence
 * Responsible for rooms, bookings, scheduling and facility context.
 */
@Module({
  imports: [
    DatabaseModule,
    RoomsModule,
    BookingsModule,
    BullModule.registerQueue({ name: GHOST_MEETING_QUEUE }),
  ],
  providers: [GhostMeetingService, GhostMeetingProcessor],
  exports: [RoomsModule, BookingsModule, GhostMeetingService],
})
export class FacilityModule {}

