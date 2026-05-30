import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwilioAdapter } from './adapters/twilio.adapter';
import { NumverifyAdapter } from './adapters/numverify.adapter';
import { CARRIER_LOOKUP } from './interfaces/carrier-lookup.interface';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    TwilioAdapter,
    NumverifyAdapter,
    {
      provide: CARRIER_LOOKUP,
      inject: [ConfigService, TwilioAdapter, NumverifyAdapter],
      useFactory: (config: ConfigService, twilio: TwilioAdapter, numverify: NumverifyAdapter) =>
        config.get('interceptionMode') === 'twilio' ? twilio : numverify,
    },
  ],
  exports: [CARRIER_LOOKUP],
})
export class CarrierModule {}
