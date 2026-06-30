import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write an activity log entry to the database.
   * Called by services or the global interceptor after state-changing operations.
   */
  async log(params: LogActivityParams): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          userId: params.userId,
          metadata: params.metadata ?? {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      // Never throw — activity logging must not break the main request flow
      this.logger.error(`Failed to write activity log: ${(err as Error).message}`, (err as Error).stack);
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
