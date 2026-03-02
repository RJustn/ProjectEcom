// ensure environment variables (including Clerk key) are loaded before any other imports
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const defaultFrontendOrigins = [
    'http://localhost:3000',
    'https://ricasataecomproject.vercel.app',
  ];

  const frontendOrigins = (process.env.FRONTEND_URL || defaultFrontendOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
