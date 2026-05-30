import { Body, Controller, Header, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { TwilioWebhookDto, NativeCheckDto } from './dto/twilio-webhook.dto';

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('call')
  @Header('Content-Type', 'text/xml')
  @ApiOperation({ summary: 'Twilio incoming call webhook' })
  handleTwilioCall(@Body() dto: TwilioWebhookDto) {
    return this.webhookService.handleIncomingCall(dto.From).then((r) => r.twiml ?? '');
  }

  @Post('check')
  @ApiOperation({ summary: 'Native mode: check a number before it rings' })
  handleNativeCheck(@Body() dto: NativeCheckDto) {
    return this.webhookService.handleIncomingCall(dto.callerNumber);
  }
}
