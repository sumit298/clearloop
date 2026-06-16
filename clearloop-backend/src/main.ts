import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.enableCors({
    origin: [
      'https://clearloop-nu.vercel.app',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Capture raw body ONLY for webhook signature verification
  app.use(
    '/github/webhook',
    bodyParser.json({
      limit: "10mb",
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(bodyParser.json());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();

