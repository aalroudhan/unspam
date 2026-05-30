import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwilioAdapter } from './adapters/twilio.adapter';
import { IpQualityScoreAdapter } from './adapters/ipqualityscore.adapter';
import { CARRIER_LOOKUP } from './interfaces/carrier-lookup.interface';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    TwilioAdapter,
    IpQualityScoreAdapter,
    {
      provide: CARRIER_LOOKUP,
      inject: [ConfigService, TwilioAdapter, IpQualityScoreAdapter],
      useFactory: (config: ConfigService, twilio: TwilioAdapter, ipqs: IpQualityScoreAdapter) =>
        config.get('interceptionMode') === 'twilio' ? twilio : ipqs,
    },
  ],
  exports: [CARRIER_LOOKUP],
})
export class CarrierModule {}
