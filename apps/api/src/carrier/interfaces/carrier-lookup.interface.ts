export interface CarrierInfo {
  isVoip: boolean;
  isNonFixedVoip: boolean; // nonFixedVoip = no physical address (TextNow, Google Voice) — higher risk
  isSpoofed: boolean;
  carrierType: string;
  carrierName: string;
}

export interface ICarrierLookup {
  lookup(phoneNumber: string): Promise<CarrierInfo>;
}

export const CARRIER_LOOKUP = Symbol('ICarrierLookup');
