import { Injectable } from '@nestjs/common';
import { CarrierInfo, ICarrierLookup } from '../interfaces/carrier-lookup.interface';

const UNKNOWN: CarrierInfo = {
  isVoip: false,
  isNonFixedVoip: false,
  isSpoofed: false,
  carrierType: 'unknown',
  carrierName: 'Unknown',
};

// Used in native mode when no carrier lookup API is configured
@Injectable()
export class NullCarrierAdapter implements ICarrierLookup {
  lookup(_phoneNumber: string): Promise<CarrierInfo> {
    return Promise.resolve(UNKNOWN);
  }
}
