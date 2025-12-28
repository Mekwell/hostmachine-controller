import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

async function bootstrap() {
  const httpsOptions = {
    key: fs.existsSync('./certs/controller.key') ? fs.readFileSync('./certs/controller.key') : null,
    cert: fs.existsSync('./certs/controller.crt') ? fs.readFileSync('./certs/controller.crt') : null,
    ca: fs.existsSync('./certs/ca.crt') ? fs.readFileSync('./certs/ca.crt') : null,
    requestCert: true,
    rejectUnauthorized: false, // Set to true after all nodes are migrated
  };

  const app = await NestFactory.create(AppModule, {
      httpsOptions: httpsOptions.key ? httpsOptions : undefined
  });
  
  // Enable CORS for Frontend
  app.enableCors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:3002',
        'https://hostmachine.com.au',
        'https://www.hostmachine.com.au'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
