import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CallLog, CallOutcome } from '../calls/entities/call-log.entity';

interface CarrierEntry {
  name: string;
  match_patterns: string[];
  abuse_email: string;
  abuse_url: string;
  customer_service_phone: string | null;
}

export interface CarrierReport {
  carrier: string;
  abuseEmail: string | null;
  abuseUrl: string | null;
  numberCount: number;
  numbers: string[];
  gmailUrl: string | null;
  unmatched: boolean;
}

@Injectable()
export class ReportsService {
  private readonly carriers: CarrierEntry[];

  constructor(
    @InjectRepository(CallLog)
    private readonly callLogs: Repository<CallLog>,
  ) {
    this.carriers = JSON.parse(
      readFileSync(join(__dirname, 'data', 'carriers.json'), 'utf8'),
    );
  }

  async generateReports(): Promise<CarrierReport[]> {
    const intercepted = await this.callLogs.find({
      where: [{ outcome: CallOutcome.BLOCKED }, { outcome: CallOutcome.VOICEMAIL }],
      order: { createdAt: 'DESC' },
    });

    // Group unique numbers by carrier
    const seen = new Set<string>();
    const byCarrier = new Map<string, { numbers: Set<string>; entry: CarrierEntry | null }>();

    for (const log of intercepted) {
      if (seen.has(log.callerNumber)) continue;
      seen.add(log.callerNumber);

      const carrierKey = log.carrierName ?? log.carrierType ?? 'Unknown';
      const entry = this.matchCarrier(carrierKey);
      const groupKey = entry ? entry.name : carrierKey;

      if (!byCarrier.has(groupKey)) {
        byCarrier.set(groupKey, { numbers: new Set(), entry });
      }
      byCarrier.get(groupKey)!.numbers.add(log.callerNumber);
    }

    return Array.from(byCarrier.entries())
      .map(([carrier, { numbers, entry }]) => {
        const numList = Array.from(numbers);
        const gmailUrl = entry?.abuse_email
          ? this.buildGmailUrl(entry, numList)
          : null;

        return {
          carrier,
          abuseEmail: entry?.abuse_email ?? null,
          abuseUrl: entry?.abuse_url ?? null,
          numberCount: numList.length,
          numbers: numList,
          gmailUrl,
          unmatched: !entry,
        };
      })
      .sort((a, b) => b.numberCount - a.numberCount);
  }

  private matchCarrier(carrierName: string): CarrierEntry | null {
    for (const entry of this.carriers) {
      if (entry.match_patterns.some((p) => carrierName.toLowerCase().includes(p.toLowerCase()))) {
        return entry;
      }
    }
    return null;
  }

  private buildGmailUrl(entry: CarrierEntry, numbers: string[]): string {
    const subject = `Robocall/spam complaint — ${numbers.length} number${numbers.length > 1 ? 's' : ''} on your network`;

    const numberList = numbers.map((n) => `  • ${n}`).join('\n');
    const body = [
      'Hello,',
      '',
      'I am filing a formal complaint regarding phone numbers on your network that are being used to place unsolicited spam or robocall traffic.',
      '',
      `Carrier identified : ${entry.name}`,
      `Numbers flagged    : ${numbers.length}`,
      '',
      numberList,
      '',
      'These numbers were detected and blocked by an automated spam call screening system. Each number scored above the spam threshold based on VoIP carrier type, number reassignment signals, and/or community reports.',
      '',
      'I request that you:',
      '  1. Investigate the accounts associated with the numbers listed above.',
      '  2. Take action consistent with your acceptable-use policy and TRACED Act obligations.',
      '  3. Reply with a ticket or case number confirming receipt.',
      '',
      'Thank you.',
    ].join('\n');

    return (
      'https://mail.google.com/mail/?view=cm&fs=1' +
      '&to=' + encodeURIComponent(entry.abuse_email) +
      '&su=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body)
    );
  }
}
