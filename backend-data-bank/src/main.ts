import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { Neo4jService } from './database/neo4j/neo4j.service';

async function bootstrap() {
  // Winston logger config (classic Nest look on console)
  const logger = new Logger('Bootstrap');
  const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'data-bank' },
    transports: [
      // Console: classic Nest-like format
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          nestWinstonModuleUtilities.format.nestLike('data-bank', {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
      // Files: structured JSON
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4000', 'http://127.0.0.1:4000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });


  try {
    const neo4jService = app.get(Neo4jService);
    logger.log('Testing Neo4j connection...');  // ✅ Use logger, not this.logger
    
    // Simple connection test
    await neo4jService.query('RETURN 1 as test');
    logger.log('✅ Neo4j connection successful');  // ✅ Use logger, not this.logger
  } catch (error) {
    logger.error('❌ Neo4j connection failed:', error.message);  // ✅ Use logger, not this.logger
    // Continue startup even if Neo4j fails (for graceful degradation)
  }

  const port = process.env.PORT || 5000;
  await app.listen(port);

  
  logger.log(`Backend running on http://localhost:${port}`);
}

bootstrap();