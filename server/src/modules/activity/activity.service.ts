import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ACTIVITY_QUEUE } from '../../queue/queue.constants';

export interface LogActivityParams {
  action: string;       // e.g. 'BOOKING_CREATED', 'TICKET_ASSIGNED'
  entityType: string;   // e.g. 'Booking', 'Ticket', 'Visitor'
  entityId: string;
  userId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(ACTIVITY_QUEUE) private readonly activityQueue: Queue,
  ) {}

  /**
   * Enqueue an async job to write an activity log entry to the database.
   * This prevents activity logging from blocking the main request flow.
   */
  async log(params: LogActivityParams): Promise<void> {
    try {
      this.logger.debug(`Enqueuing activity log: ${params.action} on ${params.entityType} ${params.entityId}`);
      await this.activityQueue.add('write-activity-log', params, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
    } catch (err) {
      this.logger.error(`Failed to enqueue activity log: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  /** Retrieve paginated activity logs (admin / audit view) */
  async findAll(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, entityType, entityId, action, from, to, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(userId ? { userId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(action ? { action } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
