import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLoggerInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    // We only log state-changing actions (POST, PATCH, PUT, DELETE)
    const isStateChange = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(async () => {
        if (isStateChange && user) {
          try {
            // Placeholder: Record the activity in the database
            // In a real scenario, we'd have a dedicated Activity table
            // For now, we log to console and prepare the "Ingestion" logic
            this.logger.log(
              `[AI INGESTION] User ${user.id} performed ${method} on ${url}`,
            );
            
            // TODO: Persist to a dedicated ActivityLog table when fully implemented
            // await this.prisma.activityLog.create({ ... })
          } catch (err) {
            this.logger.error('Failed to log activity', err);
          }
        }
      }),
    );
  }
}
