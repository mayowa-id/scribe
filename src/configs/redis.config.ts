import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModuleAsyncOptions } from '@liaoliaots/nestjs-redis';

export const redisConfig: RedisModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    config: {
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
    },
  }),
};
