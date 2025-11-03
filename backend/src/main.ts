import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Configure body parser for file uploads
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.use(bodyParser.raw({ limit: '10mb' }));

  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  // CORS configuration - be more permissive in production for file uploads
  const corsOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://seguranca-trabalho.vercel.app',
    'https://seguranca-trabalho-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  console.log('Allowed CORS origins:', corsOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS rejected origin:', origin);
        callback(null, true); // In production, be more permissive for now
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve static files from uploads directory
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Serve frontend static files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(process.cwd(), '..', 'frontend', 'dist');
    console.log('Serving frontend from:', frontendPath);
    app.useStaticAssets(frontendPath, {
      prefix: '',
      index: false,
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Sistema de Saúde e Segurança do Trabalho')
    .setDescription('API para gerenciamento de avaliações de saúde e segurança')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3333;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
}
bootstrap();