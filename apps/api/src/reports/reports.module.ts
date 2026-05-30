import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallLog } from '../calls/entities/call-log.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
