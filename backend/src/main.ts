import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Body size limit: 1MB max for all request bodies
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ limit: '1mb', extended: true }));

  // Request ID middleware — attaches X-Request-Id for tracing
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  app.use(cookieParser());

  // HTTPS redirect in production — trust proxy must be configured
  if (process.env.NODE_ENV === 'production') {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1); // Trust first proxy only
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.protocol !== 'https') {
        const allowedHost = process.env.ALLOWED_HOST || req.headers.host;
        return res.redirect(301, `https://${allowedHost}${req.url}`);
      }
      next();
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AgentLedger API')
      .setDescription('Tamper-proof audit trail API for AI agents')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`AgentLedger API running on port ${port}`);
}
bootstrap();
