import { Module } from '@nestjs/common';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';
import { GhostMeetingService } from './ghost-meeting.service';

/**
 * FacilityModule — Domain A: Facility / Meeting Intelligence
 * Responsible for rooms, bookings, scheduling and facility context.
 */
@Module({
  imports: [RoomsModule, BookingsModule],
  providers: [GhostMeetingService],
  exports: [RoomsModule, BookingsModule, GhostMeetingService],
})
export class FacilityModule {}

