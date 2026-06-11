import { gql } from '@apollo/client';
import { apollo } from './apollo';
import type { CheckResult, CallLog, Stats, CarrierReport } from './types';

// Token state mirrored into localStorage; the Apollo auth link reads it from
// there on every request (see apollo.ts).
let token: string | null = localStorage.getItem('unspam_token');

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('unspam_token', t);
  else localStorage.removeItem('unspam_token');
}

export function getToken() {
  return token;
}

const CHECK_NUMBER = gql`
  mutation CheckNumber($callerNumber: String!) {
    checkNumber(callerNumber: $callerNumber) {
      outcome
      score
      reasons
      communityFlags
      twiml
      carrier {
        isVoip
        isNonFixedVoip
        isSpoofed
        carrierType
        carrierName
      }
    }
  }
`;

const CALL_LOG = gql`
  query CallLog($limit: Int) {
    callLog(limit: $limit) {
      data {
        id
        callerNumber
        spamScore
        outcome
        mode
        carrierType
        carrierName
        isVoip
        isSpoofed
        createdAt
      }
      total
    }
  }
`;

const CALL_STATS = gql`
  query CallStats {
    callStats {
      total
      blocked
      today
      blockedRate
      dailyStats {
        date
        total
        blocked
      }
    }
  }
`;

const FLAG_NUMBER = gql`
  mutation FlagNumber($number: String!) {
    flagNumber(number: $number)
  }
`;

const REPORTS = gql`
  query Reports {
    reports {
      carrier
      abuseEmail
      abuseUrl
      numberCount
      numbers
      unmatched
    }
  }
`;

const SEND_REPORT = gql`
  mutation SendReport($carrier: String!, $testMode: Boolean) {
    sendReport(carrier: $carrier, testMode: $testMode) {
      sent
    }
  }
`;

const REGISTER = gql`
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

const ME = gql`
  query Me {
    me {
      id
      email
      createdAt
    }
  }
`;

export const api = {
  check: async (callerNumber: string): Promise<CheckResult> => {
    const { data } = await apollo.mutate({
      mutation: CHECK_NUMBER,
      variables: { callerNumber },
    });
    return data.checkNumber as CheckResult;
  },

  getCalls: async (limit = 20): Promise<{ data: CallLog[]; total: number }> => {
    const { data } = await apollo.query({ query: CALL_LOG, variables: { limit } });
    return data.callLog as { data: CallLog[]; total: number };
  },

  getStats: async (): Promise<Stats> => {
    const { data } = await apollo.query({ query: CALL_STATS });
    return data.callStats as Stats;
  },

  flag: async (number: string): Promise<void> => {
    await apollo.mutate({ mutation: FLAG_NUMBER, variables: { number } });
  },

  getReports: async (): Promise<CarrierReport[]> => {
    const { data } = await apollo.query({ query: REPORTS });
    return data.reports as CarrierReport[];
  },

  sendReport: async (carrier: string, testMode: boolean): Promise<void> => {
    await apollo.mutate({ mutation: SEND_REPORT, variables: { carrier, testMode } });
  },

  auth: {
    register: async (email: string, password: string): Promise<{ token: string }> => {
      const { data } = await apollo.mutate({ mutation: REGISTER, variables: { email, password } });
      return data.register as { token: string };
    },
    login: async (email: string, password: string): Promise<{ token: string }> => {
      const { data } = await apollo.mutate({ mutation: LOGIN, variables: { email, password } });
      return data.login as { token: string };
    },
    me: async (): Promise<{ id: string; email: string; createdAt: string }> => {
      const { data } = await apollo.query({ query: ME });
      return data.me as { id: string; email: string; createdAt: string };
    },
  },
};
