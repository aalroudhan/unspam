import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CallLog } from '../calls/entities/call-log.entity';

export const CALL_INTERCEPTED_EVENT = 'call.intercepted';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Observer: reacts to call.intercepted events emitted by WebhookService
  @OnEvent(CALL_INTERCEPTED_EVENT)
  async handleCallIntercepted(callLog: CallLog): Promise<void> {
    this.logger.log(`Push notification: intercepted ${callLog.callerNumber} → ${callLog.outcome}`);
    // FCM integration goes here
  }
}
