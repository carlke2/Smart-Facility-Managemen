import { Module } from '@nestjs/common';
import { TicketsModule } from './tickets/tickets.module';

/**
 * SupportModule — Domain B: Support Operations / Ticketing
 * Responsible for incidents, service requests, ticket workflow,
 * assignment, escalation and resolution.
 */
@Module({
  imports: [TicketsModule],
  exports: [TicketsModule],
})
export class SupportModule {}
