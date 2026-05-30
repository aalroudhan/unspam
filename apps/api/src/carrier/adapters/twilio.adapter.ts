import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CarrierInfo, ICarrierLookup } from '../interfaces/carrier-lookup.interface';

@Injectable()
export class TwilioAdapter implements ICarrierLookup {
  private readonly baseUrl = 'https://lookups.twilio.com/v2/PhoneNumbers';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async lookup(phoneNumber: string): Promise<CarrierInfo> {
    const sid = this.config.get<string>('twilio.accountSid');
    const token = this.config.get<string>('twilio.authToken');

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/${phoneNumber}`, {
        params: { Fields: 'line_type_intelligence,reassigned_number' },
        auth: { username: sid!, password: token! },
      }),
    );

    const lineType = data.line_type_intelligence?.type ?? 'unknown';
    const isNonFixedVoip = lineType === 'nonFixedVoip';
    const isVoip = isNonFixedVoip || lineType === 'fixedVoip';

    // True STIR/SHAKEN attestation is only available during live call processing (Mode A).
    // Best available signal via Lookup: number was reassigned within the last 90 days.
    // A recently recycled number is high-risk — robocallers acquire freshly released numbers.
    const reassigned = data.reassigned_number;
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    const isSpoofed =
      reassigned?.was_reassigned === true &&
      reassigned?.last_reassigned_date != null &&
      Date.now() - new Date(reassigned.last_reassigned_date).getTime() < NINETY_DAYS_MS;

    return {
      isVoip,
      isNonFixedVoip,
      isSpoofed,
      carrierType: lineType,
      carrierName: data.line_type_intelligence?.carrier_name ?? 'Unknown',
    };
  }
}
