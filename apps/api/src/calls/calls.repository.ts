import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from './entities/call-log.entity';
import { QueryCallsDto } from './dto/query-calls.dto';

@Injectable()
export class CallsRepository {
  constructor(
    @InjectRepository(CallLog)
    private readonly orm: Repository<CallLog>,
  ) {}

  save(callLog: Partial<CallLog>): Promise<CallLog> {
    return this.orm.save(this.orm.create(callLog));
  }

  findPaginated(query: QueryCallsDto): Promise<[CallLog[], number]> {
    const qb = this.orm.createQueryBuilder('call')
      .orderBy('call.createdAt', 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20);

    if (query.outcome) {
      qb.where('call.outcome = :outcome', { outcome: query.outcome });
    }

    return qb.getManyAndCount();
  }


}
