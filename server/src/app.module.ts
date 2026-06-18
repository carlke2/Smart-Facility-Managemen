import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FacilityModule } from './modules/facility/facility.module';
import { SupportModule } from './modules/support/support.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { ActivityModule } from './modules/activity/activity.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { SensorsModule } from './modules/sensors/sensors.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [

    // --- Configuration (validates required env vars at startup) ---
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRATION: Joi.string().default('1d'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      }),
    }),

    // --- Core Infrastructure ---
    DatabaseModule,
    QueueModule,

    // --- Feature Modules ---
    AuthModule,
    UsersModule,

    // --- Domain A: Facility / Meeting Intelligence ---
    FacilityModule,

    // --- Domain B: Support Operations / Ticketing ---
    SupportModule,

    // --- Supporting Modules ---
    VisitorsModule,
    ActivityModule,
    NotificationsModule,

    // --- AI Integration Boundary ---
    AiGatewayModule,

    // --- Real-time Sensor Layer ---
    SensorsModule,
  ],
})
export class AppModule {}

