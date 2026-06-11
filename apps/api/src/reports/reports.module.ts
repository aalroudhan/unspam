import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallLog } from '../calls/entities/call-log.entity';
import { EmailService } from './email.service';
import { ReportsService } from './reports.service';
import { ReportsResolver } from './reports.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog])],
  providers: [EmailService, ReportsService, ReportsResolver],
})
export class ReportsModule {}
