import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import configuration from './config/configuration';
import { CallsModule } from './calls/calls.module';
import { WebhookModule } from './webhook/webhook.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { CallLog } from './calls/entities/call-log.entity';
import { CommunityFlag } from './calls/entities/community-flag.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        database: config.get('database.name'),
        username: config.get('database.user'),
        password: config.get('database.password'),
        entities: [CallLog, CommunityFlag],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    CallsModule,
    WebhookModule,
    NotificationsModule,
    ReportsModule,
  ],
})
export class AppModule {}
