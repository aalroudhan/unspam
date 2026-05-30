export interface CarrierInfo {
  isVoip: boolean;
  isSpoofed: boolean;
  carrierType: string;
}

export interface ICarrierLookup {
  lookup(phoneNumber: string): Promise<CarrierInfo>;
}

export const CARRIER_LOOKUP = Symbol('ICarrierLookup');
