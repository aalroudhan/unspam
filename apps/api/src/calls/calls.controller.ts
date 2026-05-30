import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { CommunityFlagsService } from './community-flags.service';
import { QueryCallsDto } from './dto/query-calls.dto';

@ApiTags('calls')
@Controller('calls')
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly communityFlags: CommunityFlagsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Paginated call log' })
  getCallLog(@Query() query: QueryCallsDto) {
    return this.callsService.getCallLog(query);
  }

  @Post(':number/flag')
  @ApiOperation({ summary: 'Community-flag a number as spam' })
  flagNumber(@Param('number') number: string) {
    return this.communityFlags.flag(number);
  }
}
