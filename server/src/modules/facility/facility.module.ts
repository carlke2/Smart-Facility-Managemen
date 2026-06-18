import { Module } from '@nestjs/common';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';

/**
 * FacilityModule — Domain A: Facility / Meeting Intelligence
 * Responsible for rooms, bookings, scheduling and facility context.
 */
@Module({
  imports: [RoomsModule, BookingsModule],
  exports: [RoomsModule, BookingsModule],
})
export class FacilityModule {}
