import { Module } from '@nestjs/common';

/**
 * ActivityModule — PLACEHOLDER
 * Will handle: audit logging of all significant system events.
 * Every create/update/delete action on User, Room, Booking, Ticket
 * should emit an activity log entry.
 *
 * AI Readiness: Activity logs are a primary data source for:
 * - No-show prediction (booking patterns)
 * - Anomaly detection (unusual ticket spikes)
 * - Usage forecasting (room demand over time)
 * - All logs must be retained with: actor, action, resourceType, resourceId, timestamp, metadata
 */
@Module({})
export class ActivityModule {}
