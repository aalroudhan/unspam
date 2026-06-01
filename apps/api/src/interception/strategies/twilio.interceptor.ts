import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallOutcome } from '../../calls/entities/call-log.entity';
import { ICallInterceptor, InterceptionResult } from '../interfaces/call-interceptor.interface';

const SPAM_THRESHOLD = 0.6;

@Injectable()
export class TwilioInterceptor implements ICallInterceptor {
  constructor(private readonly config: ConfigService) {}

  async intercept(callerNumber: string, spamScore: number): Promise<InterceptionResult> {
    const forwardTo = this.config.get<string>('twilio.forwardTo');

    if (spamScore >= SPAM_THRESHOLD) {
      return {
        outcome: CallOutcome.VOICEMAIL,
        twiml: `<Response><Say>This call has been flagged as potential spam.</Say><Record/></Response>`,
      };
    }

    return {
      outcome: CallOutcome.ALLOWED,
      twiml: `<Response><Dial>${forwardTo}</Dial></Response>`,
    };
  }
}
