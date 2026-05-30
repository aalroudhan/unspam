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
    return {
      isVoip: lineType === 'voip' || lineType === 'nonFixedVoip',
      isSpoofed: data.reassigned_number?.last_reassigned_date != null,
      carrierType: lineType,
      carrierName: data.line_type_intelligence?.carrier_name ?? 'Unknown',
    };
  }
}
