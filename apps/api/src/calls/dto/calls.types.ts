import { Field, Int, ObjectType, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { CallLog, CallOutcome } from '../entities/call-log.entity';

@InputType()
export class QueryCallsInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(CallOutcome)
  outcome?: CallOutcome;

  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

@ObjectType()
export class CallLogPage {
  @Field(() => [CallLog])
  data: CallLog[];

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class DailyStat {
  @Field()
  date: Date;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  blocked: number;
}

@ObjectType()
export class CallStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  blocked: number;

  @Field(() => Int)
  today: number;

  @Field(() => Int)
  blockedRate: number;

  @Field(() => [DailyStat])
  dailyStats: DailyStat[];
}
