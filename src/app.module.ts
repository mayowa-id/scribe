import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dbConfig, redisConfig } from './configs';

import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlanModule } from './modules/plan/plan.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module';
import { InterviewModule } from './modules/interview/interview.module';
import { VoiceProfileModule } from './modules/voice-profile/voice-profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(dbConfig),
    RedisModule.forRootAsync(redisConfig),
    ScheduleModule.forRoot(),

    // BullMQ global config — reads Redis connection from env
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    // Feature modules
    UserModule,
    AuthModule,
    PlanModule,
    NotificationsModule,
    AiModule,
    InterviewModule,
    VoiceProfileModule,
    // Generation, Chapter, ScribeAssistant modules to be added next
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

