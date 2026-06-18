import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/**
 * NotificationsModule — PLACEHOLDER (foundation scaffolded)
 * Will handle: in-app, email, and SMS notifications.
 * Triggered by: booking status changes, ticket assignment,
 * visitor check-in, escalations.
 *
 * Queue-backed: notifications will be dispatched via BullMQ
 * to avoid blocking the main request thread.
 */
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
