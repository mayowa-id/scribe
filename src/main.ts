import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validationConfig } from './configs';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // FRONTEND_URL supports comma-separated origins for multi-environment setups.
  // e.g. FRONTEND_URL=https://your-app.vercel.app,http://localhost:3001
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global Middlewares
  app.use(cookieParser());

  // Global Pipes & Filters
  app.useGlobalPipes(new ValidationPipe(validationConfig));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.SERVER_PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

// Allow direct execution (local dev: `node dist/main`)
// and also import by migrate-and-start in production.
if (require.main === module) {
  bootstrap();
}
