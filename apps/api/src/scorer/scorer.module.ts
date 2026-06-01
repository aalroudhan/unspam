import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScorerService } from './scorer.service';

@Module({
  imports: [HttpModule],
  providers: [ScorerService],
  exports: [ScorerService],
})
export class ScorerModule {}
