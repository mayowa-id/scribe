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
import { ProjectModule } from './modules/project/project.module';
import { ChapterModule } from './modules/chapter/chapter.module';
import { GenerationModule } from './modules/generation/generation.module';
import { ScribeAssistantModule } from './modules/scribe-assistant/scribe-assistant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(dbConfig),
    RedisModule.forRootAsync(redisConfig),
    ScheduleModule.forRoot(),

    // BullMQ — global Redis connection for all queues
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
    ProjectModule,
    ChapterModule,
    GenerationModule,
    ScribeAssistantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
