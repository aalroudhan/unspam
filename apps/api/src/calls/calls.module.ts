import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallLog } from './entities/call-log.entity';
import { CommunityFlag } from './entities/community-flag.entity';
import { CallsRepository } from './calls.repository';
import { CommunityFlagsRepository } from './community-flags.repository';
import { CallsService } from './calls.service';
import { CommunityFlagsService } from './community-flags.service';
import { CallsController } from './calls.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog, CommunityFlag])],
  providers: [CallsRepository, CallsService, CommunityFlagsRepository, CommunityFlagsService],
  controllers: [CallsController],
  exports: [CallsService, CommunityFlagsService],
})
export class CallsModule {}
