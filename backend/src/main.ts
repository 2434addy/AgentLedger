import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // HTTPS redirect in production — trust proxy must be configured
  if (process.env.NODE_ENV === 'production') {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1); // Trust first proxy only
    app.use((req: any, res: any, next: any) => {
      if (req.protocol !== 'https') {
        const allowedHost = process.env.ALLOWED_HOST || req.headers.host;
        return res.redirect(301, `https://${allowedHost}${req.url}`);
      }
      next();
    });
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
  console.log(`AgentLedger API running on port ${port}`);
}
bootstrap();
