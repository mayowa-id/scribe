/**
 * migrate-and-start.ts
 *
 * Production entrypoint: runs TypeORM migrations using the compiled DataSource
 * (no ts-node required), then bootstraps the NestJS application.
 *
 * Built to dist/migrate-and-start.js by `nest build`.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as path from 'path';

async function runMigrationsAndStart() {
  const isProduction = process.env.NODE_ENV === 'production';

  // ---------------------------------------------------------------------------
  // 1. Run migrations using compiled JS datasource (SSL-safe, no ts-node)
  // ---------------------------------------------------------------------------
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // SSL is REQUIRED for RDS (rds.force_ssl = 1).
    // rejectUnauthorized: false accepts the RDS self-signed cert.
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    entities: [path.join(__dirname, '/**/*.entity.js')],
    migrations: [path.join(__dirname, '/migrations/*.js')],
    migrationsTableName: 'migrations',
    namingStrategy: new SnakeNamingStrategy(),
    // Sync schema on startup. Once proper migration files exist,
    // set this to false and rely on runMigrations() instead.
    synchronize: true,
  });

  console.log('Connecting to database for migrations...');
  await dataSource.initialize();
  console.log('Database connected.');

  const pendingMigrations = await dataSource.showMigrations();
  if (pendingMigrations) {
    console.log('Running pending migrations...');
    await dataSource.runMigrations({ transaction: 'each' });
    console.log('Migrations complete.');
  } else {
    console.log('No pending migrations.');
  }

  await dataSource.destroy();

  // ---------------------------------------------------------------------------
  // 2. Bootstrap NestJS application
  // ---------------------------------------------------------------------------
  console.log('Starting NestJS application...');
  // Dynamic import to avoid circular init issues
  const { bootstrap } = await import('./main');
  await bootstrap();
}

runMigrationsAndStart().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
