import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityFlag } from './entities/community-flag.entity';

@Injectable()
export class CommunityFlagsRepository {
  constructor(
    @InjectRepository(CommunityFlag)
    private readonly orm: Repository<CommunityFlag>,
  ) {}

  async getCount(callerNumber: string): Promise<number> {
    const row = await this.orm.findOne({ where: { callerNumber } });
    return row?.flagCount ?? 0;
  }

  async increment(callerNumber: string): Promise<void> {
    await this.orm.query(
      `INSERT INTO community_flags ("callerNumber", "flagCount", "updatedAt")
       VALUES ($1, 1, NOW())
       ON CONFLICT ("callerNumber")
       DO UPDATE SET "flagCount" = community_flags."flagCount" + 1, "updatedAt" = NOW()`,
      [callerNumber],
    );
  }

  async seed(callerNumber: string, flagCount: number): Promise<void> {
    const exists = await this.orm.findOne({ where: { callerNumber } });
    if (!exists) {
      await this.orm.save(this.orm.create({ callerNumber, flagCount }));
    }
  }
}
