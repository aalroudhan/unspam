import { Injectable } from '@nestjs/common';
import { CallOutcome } from '../../calls/entities/call-log.entity';
import { ICallInterceptor, InterceptionResult } from '../interfaces/call-interceptor.interface';

const SPAM_THRESHOLD = 0.6;

@Injectable()
export class NativeInterceptor implements ICallInterceptor {
  async intercept(_callerNumber: string, spamScore: number): Promise<InterceptionResult> {
    return {
      outcome: spamScore >= SPAM_THRESHOLD ? CallOutcome.BLOCKED : CallOutcome.ALLOWED,
    };
  }
}
