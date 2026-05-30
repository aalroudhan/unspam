import { CallOutcome } from '../../calls/entities/call-log.entity';

export interface InterceptionResult {
  outcome: CallOutcome;
  twiml?: string; // only relevant for Twilio mode
}

export interface ICallInterceptor {
  intercept(callerNumber: string, spamScore: number): Promise<InterceptionResult>;
}

export const CALL_INTERCEPTOR = Symbol('ICallInterceptor');
