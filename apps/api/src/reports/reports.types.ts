import { Field, Int, ObjectType, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@ObjectType()
export class CarrierReport {
  @Field()
  carrier: string;

  @Field(() => String, { nullable: true })
  abuseEmail: string | null;

  @Field(() => String, { nullable: true })
  abuseUrl: string | null;

  @Field(() => Int)
  numberCount: number;

  @Field(() => [String])
  numbers: string[];

  @Field()
  unmatched: boolean;
}

@InputType()
export class SendReportInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  carrier: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  testMode?: boolean;
}

@ObjectType()
export class SendReportResult {
  @Field()
  sent: boolean;
}
