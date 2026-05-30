import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CarrierInfo, ICarrierLookup } from '../interfaces/carrier-lookup.interface';

@Injectable()
export class IpQualityScoreAdapter implements ICarrierLookup {
  private readonly baseUrl = 'https://ipqualityscore.com/api/json/phone';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async lookup(phoneNumber: string): Promise<CarrierInfo> {
    const apiKey = this.config.get<string>('ipqs.apiKey');
    const encoded = encodeURIComponent(phoneNumber);

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/${apiKey}/${encoded}`, {
        params: { strictness: 1, allow_prepaid: true },
      }),
    );

    // IPQS uses uppercase VOIP field; line_type values: "Landline", "Wireless",
    // "Toll Free", "VOIP", "Satellite", "Premium Rate", "Pager", "Unknown"
    const lineType = (data.line_type ?? 'Unknown').toLowerCase();

    return {
      isVoip: data.VOIP === true,
      isSpoofed: false, // STIR/SHAKEN not available on free tier
      carrierType: lineType,
      carrierName: data.carrier ?? 'Unknown',
    };
  }
}
