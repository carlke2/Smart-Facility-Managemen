import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import Redis from 'ioredis';
import { GHOST_MEETING_QUEUE } from '../../queue/queue.constants';

@Processor(GHOST_MEETING_QUEUE)
export class GhostMeetingProcessor extends WorkerHost {
  private readonly logger = new Logger(GhostMeetingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'detect-ghost-meetings') {
      this.logger.log(`[QUEUE] Processing Ghost Meeting detection (Job: ${job.id})`);

      const now = new Date();
      
      const activeBookings = await this.prisma.booking.findMany({
        where: {
          status: 'APPROVED',
          date: now,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        include: { room: true },
      });

      for (const booking of activeBookings) {
        const sensorKey = `sensor:state:room_${booking.roomId}_occupancy`;
        const sensorData = await this.redis.get(sensorKey);

        if (sensorData) {
          const { value } = JSON.parse(sensorData);

          if (value === 0) {
            this.logger.warn(
              `[GHOST DETECTED] Room ${booking.room.name} is booked but appears empty.`,
            );
            
            // Further automation logic like notifying the user or auto-releasing
            // could be implemented here. For Phase 2, detection is sufficient.
          }
        }
      }

      return { processed: activeBookings.length };
    }
  }
}
