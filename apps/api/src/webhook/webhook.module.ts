import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { CallsModule } from '../calls/calls.module';
import { CarrierModule } from '../carrier/carrier.module';
import { InterceptionModule } from '../interception/interception.module';
import { ScorerModule } from '../scorer/scorer.module';

@Module({
  imports: [HttpModule, CallsModule, CarrierModule, InterceptionModule, ScorerModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
