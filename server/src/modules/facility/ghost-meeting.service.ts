import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GhostMeetingService {
  private readonly logger = new Logger(GhostMeetingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * Heartbeat task that runs every 5 minutes.
   * Compares active bookings with real-time sensor occupancy data in Redis.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleGhostMeetingDetection() {
    this.logger.log('[HEARTBEAT] Running Ghost Meeting detection...');

    const now = new Date();
    
    // 1. Get all currently active bookings
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
      // 2. Check the real-time sensor state in Redis
      // Pattern: sensor:state:room_{roomId}_occupancy
      const sensorKey = `sensor:state:room_${booking.roomId}_occupancy`;
      const sensorData = await this.redis.get(sensorKey);

      if (sensorData) {
        const { value } = JSON.parse(sensorData);

        // 3. Logic: If room is booked but occupancy sensor is 0 (Empty)
        if (value === 0) {
          this.logger.warn(
            `[GHOST DETECTED] Room ${booking.room.name} is booked but appears empty.`,
          );
          
          // TODO: Trigger automated room release or notify secretary
          // await this.releaseRoom(booking.id);
        }
      }
    }
  }
}
