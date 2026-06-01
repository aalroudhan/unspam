import { Injectable } from '@nestjs/common';
import { CommunityFlagsRepository } from './community-flags.repository';

@Injectable()
export class CommunityFlagsService {
  constructor(private readonly repo: CommunityFlagsRepository) {}

  getCount(callerNumber: string): Promise<number> {
    return this.repo.getCount(callerNumber);
  }

  flag(callerNumber: string): Promise<void> {
    return this.repo.increment(callerNumber);
  }
}
