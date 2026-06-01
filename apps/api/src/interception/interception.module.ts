import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TwilioInterceptor } from './strategies/twilio.interceptor';
import { NativeInterceptor } from './strategies/native.interceptor';
import { CALL_INTERCEPTOR } from './interfaces/call-interceptor.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    TwilioInterceptor,
    NativeInterceptor,
    {
      provide: CALL_INTERCEPTOR,
      inject: [ConfigService, TwilioInterceptor, NativeInterceptor],
      useFactory: (config: ConfigService, twilio: TwilioInterceptor, native: NativeInterceptor) =>
        config.get('interceptionMode') === 'twilio' ? twilio : native,
    },
  ],
  exports: [CALL_INTERCEPTOR],
})
export class InterceptionModule {}
