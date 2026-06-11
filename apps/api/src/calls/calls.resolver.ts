import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CommunityFlagsService } from './community-flags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CallLog } from './entities/call-log.entity';
import { CallLogPage, CallStats, QueryCallsInput } from './dto/calls.types';

@Resolver(() => CallLog)
export class CallsResolver {
  constructor(
    private readonly callsService: CallsService,
    private readonly communityFlags: CommunityFlagsService,
  ) {}

  @Query(() => CallStats, { description: 'Aggregated stats and 7-day daily trend' })
  callStats(): Promise<CallStats> {
    return this.callsService.getStats();
  }

  @Query(() => CallLogPage, { description: 'Paginated call log' })
  callLog(
    @Args('query', { nullable: true }) query?: QueryCallsInput,
  ): Promise<CallLogPage> {
    return this.callsService.getCallLog(query ?? {});
  }

  @Mutation(() => Boolean, { description: 'Community-flag a number as spam' })
  @UseGuards(JwtAuthGuard)
  async flagNumber(@Args('number') number: string): Promise<boolean> {
    await this.communityFlags.flag(number);
    return true;
  }
}
