import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CallsService } from '../calls/calls.service';
import { ScorerService } from '../scorer/scorer.service';
import { CARRIER_LOOKUP } from '../carrier/interfaces/carrier-lookup.interface';
import type { ICarrierLookup } from '../carrier/interfaces/carrier-lookup.interface';
import { CALL_INTERCEPTOR } from '../interception/interfaces/call-interceptor.interface';
import type { ICallInterceptor } from '../interception/interfaces/call-interceptor.interface';
import { InterceptionMode } from '../calls/entities/call-log.entity';
import { CALL_INTERCEPTED_EVENT } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

// Facade: single entry point hiding carrier lookup, scoring, interception, logging, and notification
@Injectable()
export class WebhookService {
  constructor(
    private readonly calls: CallsService,
    private readonly scorer: ScorerService,
    private readonly events: EventEmitter2,
    private readonly config: ConfigService,
    @Inject(CARRIER_LOOKUP) private readonly carrierLookup: ICarrierLookup,
    @Inject(CALL_INTERCEPTOR) private readonly interceptor: ICallInterceptor,
  ) {}

  async handleIncomingCall(callerNumber: string): Promise<{
    outcome: string;
    score: number;
    reasons: string[];
    carrier: { isVoip: boolean; isSpoofed: boolean; carrierType: string };
    communityFlags: number;
    twiml?: string;
  }> {
    const carrier = await this.carrierLookup.lookup(callerNumber);
    const communityFlags = await this.calls.getCommunityFlagCount(callerNumber);

    const { score, reasons } = await this.scorer.score({
      callerNumber,
      isVoip: carrier.isVoip,
      isSpoofed: carrier.isSpoofed,
      carrierType: carrier.carrierType,
      communityFlags,
    });

    const { outcome, twiml } = await this.interceptor.intercept(callerNumber, score);

    const mode = this.config.get<string>('interceptionMode') === 'twilio'
      ? InterceptionMode.TWILIO
      : InterceptionMode.NATIVE;

    const callLog = await this.calls.logCall({
      callerNumber,
      spamScore: score,
      outcome,
      mode,
      carrierType: carrier.carrierType,
      isVoip: carrier.isVoip,
      isSpoofed: carrier.isSpoofed,
      flagCount: communityFlags,
    });

    this.events.emit(CALL_INTERCEPTED_EVENT, callLog);

    return { outcome, score, reasons, carrier, communityFlags, twiml };
  }
}
