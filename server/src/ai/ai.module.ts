import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiClient } from './ai.client';
import { AiProcessor } from './ai.processor';
import { AI_INFERENCE_QUEUE } from './ai.constants';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    BullModule.registerQueue({ name: AI_INFERENCE_QUEUE }),
  ],
  controllers: [AiController],
  providers: [AiService, AiClient, AiProcessor],
  exports: [AiService],
})
export class AiModule {}
