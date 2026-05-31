import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallLog } from '../calls/entities/call-log.entity';
import { EmailService } from './email.service';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog])],
  providers: [EmailService, ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
