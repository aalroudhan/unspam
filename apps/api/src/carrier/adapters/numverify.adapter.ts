import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CarrierInfo, ICarrierLookup } from '../interfaces/carrier-lookup.interface';

@Injectable()
export class NumverifyAdapter implements ICarrierLookup {
  private readonly baseUrl = 'http://apilayer.net/api/validate';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async lookup(phoneNumber: string): Promise<CarrierInfo> {
    const apiKey = this.config.get<string>('numverify.apiKey');

    const { data } = await firstValueFrom(
      this.http.get(this.baseUrl, {
        params: { access_key: apiKey, number: phoneNumber },
      }),
    );

    const lineType = data.line_type ?? 'unknown';
    return {
      isVoip: lineType === 'voip',
      isSpoofed: false, // numverify has no spoofing data
      carrierType: lineType,
    };
  }
}
