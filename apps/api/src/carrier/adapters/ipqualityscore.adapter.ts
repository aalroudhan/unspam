import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CarrierInfo, ICarrierLookup } from '../interfaces/carrier-lookup.interface';

const UNKNOWN: CarrierInfo = { isVoip: false, isNonFixedVoip: false, isSpoofed: false, carrierType: 'unknown', carrierName: 'Unknown' };

@Injectable()
export class IpQualityScoreAdapter implements ICarrierLookup {
  private readonly logger = new Logger(IpQualityScoreAdapter.name);
  private readonly baseUrl = 'https://ipqualityscore.com/api/json/phone';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async lookup(phoneNumber: string): Promise<CarrierInfo> {
    const apiKey = this.config.get<string>('ipqs.apiKey');

    if (!apiKey) {
      this.logger.warn('IPQS_API_KEY not set — carrier lookup skipped');
      return UNKNOWN;
    }

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/${apiKey}/${encodeURIComponent(phoneNumber)}`, {
          params: { strictness: 1, allow_prepaid: true },
        }),
      );

      if (!data.success) {
        this.logger.warn(`IPQS lookup failed: ${data.message}`);
        return UNKNOWN;
      }

      // IPQS uses uppercase VOIP; line_type: "Landline","Wireless","Toll Free","VOIP", etc.
      // IPQS cannot distinguish fixed vs non-fixed VoIP, so treat all detected VoIP as non-fixed
      const isVoip = data.VOIP === true;
      return {
        isVoip,
        isNonFixedVoip: isVoip,
        isSpoofed: false,
        carrierType: (data.line_type ?? 'Unknown').toLowerCase(),
        carrierName: data.carrier ?? 'Unknown',
      };
    } catch (err) {
      this.logger.error(`IPQS request error: ${err.message}`);
      return UNKNOWN;
    }
  }
}
