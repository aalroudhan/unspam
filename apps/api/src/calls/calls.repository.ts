import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { CallLog } from './entities/call-log.entity';
import { QueryCallsInput } from './dto/calls.types';

@Injectable()
export class CallsRepository {
  constructor(
    @InjectRepository(CallLog)
    private readonly orm: Repository<CallLog>,
  ) {}

  save(callLog: Partial<CallLog>): Promise<CallLog> {
    return this.orm.save(this.orm.create(callLog));
  }

  findPaginated(query: QueryCallsInput): Promise<[CallLog[], number]> {
    const qb = this.orm.createQueryBuilder('call')
      .orderBy('call.createdAt', 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20);

    if (query.outcome) {
      qb.where('call.outcome = :outcome', { outcome: query.outcome });
    }

    return qb.getManyAndCount();
  }

  async getStats() {
    const total   = await this.orm.count();
    const blocked = await this.orm.count({ where: [{ outcome: 'blocked' as any }, { outcome: 'voicemail' as any }] });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = await this.orm.count({ where: { createdAt: MoreThanOrEqual(todayStart) } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const daily = await this.orm
      .createQueryBuilder('c')
      .select("DATE_TRUNC('day', c.createdAt)", 'day')
      .addSelect('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN c.outcome IN ('blocked','voicemail') THEN 1 ELSE 0 END)", 'blocked')
      .where('c.createdAt >= :start', { start: sevenDaysAgo })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      total,
      blocked,
      today,
      blockedRate: total > 0 ? Math.round(blocked / total * 100) : 0,
      dailyStats: daily.map(d => ({
        date: d.day,
        total: Number(d.total),
        blocked: Number(d.blocked),
      })),
    };
  }
}
