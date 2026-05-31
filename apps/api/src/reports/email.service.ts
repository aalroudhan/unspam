import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.config.get<string>('email.user'),
        pass: this.config.get<string>('email.pass'),
      },
    });
  }

  async send(to: string, subject: string, body: string, testMode = false): Promise<void> {
    const from = this.config.get<string>('email.user')!;
    const recipient = testMode ? from : to;

    if (testMode) {
      this.logger.warn(`Test mode — redirecting to ${from} (intended: ${to})`);
    }

    await this.transporter.sendMail({ from, to: recipient, subject, text: body });
    this.logger.log(`Sent complaint to ${recipient}`);
  }
}
