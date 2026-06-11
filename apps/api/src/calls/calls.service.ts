import { Injectable } from '@nestjs/common';
import { CallLog } from './entities/call-log.entity';
import { CallsRepository } from './calls.repository';
import { QueryCallsInput } from './dto/calls.types';

@Injectable()
export class CallsService {
  constructor(private readonly repo: CallsRepository) {}

  async getCallLog(query: QueryCallsInput): Promise<{ data: CallLog[]; total: number }> {
    const [data, total] = await this.repo.findPaginated(query);
    return { data, total };
  }

  async logCall(callLog: Partial<CallLog>): Promise<CallLog> {
    return this.repo.save(callLog);
  }

  async getStats() {
    return this.repo.getStats();
  }
}
