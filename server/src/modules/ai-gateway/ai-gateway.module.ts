import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayProcessor } from './ai-gateway.processor';
import { DatabaseModule } from '../../database/database.module';
import { AI_INTEGRATION_QUEUE } from '../../queue/queue.constants';

@Global()
@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    BullModule.registerQueue({ name: AI_INTEGRATION_QUEUE }),
  ],
  controllers: [AiGatewayController],
  providers: [AiGatewayService, AiGatewayProcessor],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
