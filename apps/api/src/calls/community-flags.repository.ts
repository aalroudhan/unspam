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
    await this.orm
      .createQueryBuilder()
      .insert()
      .into(CommunityFlag)
      .values({ callerNumber, flagCount: 1 })
      .orUpdate(['flag_count'], ['caller_number'], {
        skipUpdateIfNoValuesChanged: false,
      })
      .execute();

    await this.orm
      .createQueryBuilder()
      .update(CommunityFlag)
      .set({ flagCount: () => 'flag_count + 1' })
      .where('caller_number = :callerNumber', { callerNumber })
      .execute();
  }

  async seed(callerNumber: string, flagCount: number): Promise<void> {
    const exists = await this.orm.findOne({ where: { callerNumber } });
    if (!exists) {
      await this.orm.save(this.orm.create({ callerNumber, flagCount }));
    }
  }
}
