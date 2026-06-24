import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const dbConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    if (configService.get<string>('NODE_ENV') !== 'production') {
      return {
        type: 'sqlite',
        database: 'scribe_local.sqlite',
        entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
        synchronize: true,
        namingStrategy: new SnakeNamingStrategy(),
      };
    }
    
    return {
      type: 'postgres',
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT'),
      username: configService.get<string>('DB_USER'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_DATABASE'),
      ssl: { rejectUnauthorized: false },
      entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
      synchronize: false,
      namingStrategy: new SnakeNamingStrategy(),
      invalidWhereValuesBehavior: { null: 'throw', undefined: 'throw' },
    };
  },
};
