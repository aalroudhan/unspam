import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CallLog, CallOutcome } from '../calls/entities/call-log.entity';
import { EmailService } from './email.service';

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
  unmatched: boolean;
}

@Injectable()
export class ReportsService {
  private readonly carriers: CarrierEntry[];

  constructor(
    @InjectRepository(CallLog)
    private readonly callLogs: Repository<CallLog>,
    private readonly email: EmailService,
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
      .map(([carrier, { numbers, entry }]) => ({
        carrier,
        abuseEmail: entry?.abuse_email ?? null,
        abuseUrl: entry?.abuse_url ?? null,
        numberCount: numbers.size,
        numbers: Array.from(numbers),
        unmatched: !entry,
      }))
      .sort((a, b) => b.numberCount - a.numberCount);
  }

  async sendReport(carrierName: string, testMode: boolean): Promise<void> {
    const reports = await this.generateReports();
    const report = reports.find((r) => r.carrier === carrierName);

    if (!report) throw new NotFoundException(`No report found for carrier: ${carrierName}`);
    if (!report.abuseEmail && !testMode) throw new NotFoundException(`No abuse contact known for: ${carrierName}`);

    const subject = `Robocall/spam complaint — ${report.numberCount} number${report.numberCount !== 1 ? 's' : ''} on your network`;
    const body = this.buildBody(report);

    await this.email.send(report.abuseEmail!, subject, body, testMode);
  }

  private buildBody(report: CarrierReport): string {
    const numberList = report.numbers.map((n) => `  • ${n}`).join('\n');
    return [
      'Hello,',
      '',
      'I am filing a formal complaint regarding phone numbers on your network that are being used to place unsolicited spam or robocall traffic.',
      '',
      `Carrier identified : ${report.carrier}`,
      `Numbers flagged    : ${report.numberCount}`,
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
  }

  private matchCarrier(carrierName: string): CarrierEntry | null {
    for (const entry of this.carriers) {
      if (entry.match_patterns.some((p) => carrierName.toLowerCase().includes(p.toLowerCase()))) {
        return entry;
      }
    }
    return null;
  }
}
