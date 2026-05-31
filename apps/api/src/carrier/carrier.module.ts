import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwilioAdapter } from './adapters/twilio.adapter';
import { NullCarrierAdapter } from './adapters/null.adapter';
import { CARRIER_LOOKUP } from './interfaces/carrier-lookup.interface';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    TwilioAdapter,
    NullCarrierAdapter,
    {
      provide: CARRIER_LOOKUP,
      inject: [ConfigService, TwilioAdapter, NullCarrierAdapter],
      useFactory: (config: ConfigService, twilio: TwilioAdapter, nullAdapter: NullCarrierAdapter) =>
        config.get('interceptionMode') === 'twilio' ? twilio : nullAdapter,
    },
  ],
  exports: [CARRIER_LOOKUP],
})
export class CarrierModule {}
