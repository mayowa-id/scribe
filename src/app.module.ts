import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dbConfig, redisConfig } from './configs';

import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlanModule } from './modules/plan/plan.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(dbConfig),
    RedisModule.forRootAsync(redisConfig),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    PlanModule,
    // Feature modules will be added here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
