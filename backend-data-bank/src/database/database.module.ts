import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jModule } from 'nest-neo4j';
import { Neo4jService } from './neo4j/neo4j.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    Neo4jModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        scheme: 'bolt',
        host: configService.get<string>('NEO4J_HOST', 'neo4j-service'),
        port: configService.get<number>('NEO4J_PORT', 7687),
        username: configService.get<string>('NEO4J_USERNAME', 'neo4j'),
        password: configService.get<string>('NEO4J_PASSWORD', 'password1234'),
        encrypted: false,
      }),
      inject: [ConfigService],
    })
  ],
  providers: [Neo4jService], 
  exports: [Neo4jService],    
})
export class DatabaseModule { }