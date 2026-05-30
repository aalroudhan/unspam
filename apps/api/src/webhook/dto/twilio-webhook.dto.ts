import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwilioWebhookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  From: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  To: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  CallSid: string;
}

export class NativeCheckDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  callerNumber: string;
}
