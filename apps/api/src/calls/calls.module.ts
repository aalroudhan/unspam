import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallLog } from './entities/call-log.entity';
import { CallsRepository } from './calls.repository';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog])],
  providers: [CallsRepository, CallsService],
  controllers: [CallsController],
  exports: [CallsService],
})
export class CallsModule {}
