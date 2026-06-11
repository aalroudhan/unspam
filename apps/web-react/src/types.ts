export interface CarrierInfo {
  isVoip: boolean;
  isNonFixedVoip: boolean;
  isSpoofed: boolean;
  carrierType: string;
  carrierName: string;
}

export interface CheckResult {
  outcome: string;
  score: number;
  reasons: string[];
  carrier: CarrierInfo;
  communityFlags: number;
  twiml?: string;
}

export interface CallLog {
  id: string;
  callerNumber: string;
  spamScore: number;
  outcome: string;
  mode: string;
  carrierType: string;
  carrierName: string;
  isVoip: boolean;
  isSpoofed: boolean;
  createdAt: string;
}

export interface DailyStat {
  date: string;
  total: number;
  blocked: number;
}

export interface Stats {
  total: number;
  blocked: number;
  today: number;
  blockedRate: number;
  dailyStats: DailyStat[];
}

export interface CarrierReport {
  carrier: string;
  abuseEmail: string | null;
  abuseUrl: string | null;
  numberCount: number;
  numbers: string[];
  unmatched: boolean;
}
