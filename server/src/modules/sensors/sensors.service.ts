import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { UpdateSensorDto } from './dto/sensor-data.dto';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Updates the state of a sensor in the Redis cache.
   * Key pattern: sensor:state:{sensorId}
   */
  async updateSensorState(dto: UpdateSensorDto) {
    const key = `sensor:state:${dto.sensorId}`;
    const data = {
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    // Store in Redis with a 24-hour expiration (TTL)
    // Sensors typically send data frequently, so we keep the latest state.
    await this.redis.set(key, JSON.stringify(data), 'EX', 86400);

    this.logger.log(`Sensor state updated: ${dto.sensorId} = ${dto.value}`);
    
    // logic for "Extension Time" can be triggered here
    // e.g. if (dto.type === 'occupancy' && dto.value === 1) { checkBooking(dto.sensorId) }

    return { success: true, sensorId: dto.sensorId };
  }

  /**
   * Retrieves the current state of a sensor.
   */
  async getSensorState(sensorId: string) {
    const key = `sensor:state:${sensorId}`;
    const data = await this.redis.get(key);
    
    if (!data) return null;
    return JSON.parse(data);
  }

  /**
   * Retrieves all active sensor states (using a pattern scan).
   */
  async getAllSensorStates() {
    const keys = await this.redis.keys('sensor:state:*');
    if (keys.length === 0) return [];

    const states = await Promise.all(keys.map(key => this.redis.get(key)));
    return states.map(state => JSON.parse(state!));
  }
}
