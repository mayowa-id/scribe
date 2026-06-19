import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  migrationsTableName: 'migrations',
  // In production (container), entities and migrations are compiled JS.
  // Locally, they are TypeScript source files.
  entities: isProduction
    ? ['dist/**/*.entity.js']
    : ['src/**/*.entity.ts'],
  migrations: isProduction
    ? ['dist/migrations/*.js']
    : ['migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  // Use synchronize in production ONLY if no migrations exist yet.
  // Switch to false once you have real migration files.
  synchronize: isProduction,
  invalidWhereValuesBehavior: { null: 'throw', undefined: 'throw' },
});

export default AppDataSource;
