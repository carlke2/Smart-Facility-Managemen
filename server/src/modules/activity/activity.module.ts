import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityProcessor } from './activity.processor';
import { DatabaseModule } from '../../database/database.module';
import { ACTIVITY_QUEUE } from '../../queue/queue.constants';

@Global()
@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({ name: ACTIVITY_QUEUE }),
  ],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityProcessor],
  exports: [ActivityService],
})
export class ActivityModule {}
