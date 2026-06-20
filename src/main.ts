import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const adapter = new FastifyAdapter({
    bodyLimit: 1_048_576,
    logger: {
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["stripe-signature"]',
          'req.headers["svix-signature"]',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'SYS:standard',
                colorize: true,
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    {
      rawBody: true,
    },
  );
  const configService = app.get(ConfigService);

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED') === 'true';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('SLOTY API')
      .setDescription('REST API for SLOTY local business appointments.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const corsOrigins =
    configService
      .get<string>('CORS_ORIGINS', '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean) || [];

  const nodeEnv = configService.get<string>('NODE_ENV');
  if (nodeEnv === 'production' && corsOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGINS must contain at least one trusted origin in production.',
    );
  }

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : nodeEnv === 'development',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    maxAge: 86_400,
  });
  app.enableShutdownHooks();
  app.get(PrismaService).enableShutdownHooks(app);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
}
void bootstrap().catch((error: unknown) => {
  console.error('Failed to start SLOTY API.', error);
  process.exitCode = 1;
});
