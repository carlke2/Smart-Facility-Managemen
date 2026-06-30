import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityService } from '../../modules/activity/activity.service';

/**
 * Global interceptor that automatically writes an ActivityLog record
 * for every state-changing request (POST, PATCH, PUT, DELETE).
 *
 * These logs are the primary data source for Phase 3 AI:
 * - No-show prediction (booking patterns)
 * - Anomaly detection (ticket spikes, no-show spikes)
 * - Usage forecasting (room demand over time)
 */
@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLoggerInterceptor.name);

  constructor(private readonly activityService: ActivityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    const isStateChange = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(async (responseBody) => {
        if (isStateChange && user) {
          // Derive entity type from URL path (e.g. /api/v1/bookings → Booking)
          const segments = url.replace(/^\/api\/v\d+\//, '').split('/');
          const rawEntity = segments[0] ?? 'unknown';
          const entityType = rawEntity.charAt(0).toUpperCase() + rawEntity.slice(1).replace(/-/g, '');

          // Try to extract entity ID from response body or URL
          const entityId =
            responseBody?.id ??
            segments[1] ??
            'unknown';

          // Map HTTP method to action name
          const actionMap: Record<string, string> = {
            POST: `${entityType.toUpperCase()}_CREATED`,
            PATCH: `${entityType.toUpperCase()}_UPDATED`,
            PUT: `${entityType.toUpperCase()}_UPDATED`,
            DELETE: `${entityType.toUpperCase()}_DELETED`,
          };
          const action = actionMap[method] ?? `${entityType.toUpperCase()}_${method}`;

          await this.activityService.log({
            action,
            entityType,
            entityId: String(entityId),
            userId: user.id,
            ipAddress: ip,
            userAgent: headers['user-agent'],
            metadata: { method, url, statusHint: 'success' },
          });
        }
      }),
    );
  }
}
