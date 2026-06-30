import { Module } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
