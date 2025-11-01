import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Add this import
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CardModule } from './card/card.module';
import { TransactionModule } from './transaction/transaction.module';
import { AccountModule } from './account/account.module';
import { FraudSystemModule } from './fraud-system/fraud-system.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Neo4jService } from './database/neo4j/neo4j.service';
import { GeolocationService } from './geolocation/geolocation.service';
import { RepositoryService } from './repository/repository.service';
import { UsersModule } from './users/users.module';
import { RepositoryModule } from './repository/repository.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    AccountModule, 
    UsersModule, 
    CardModule, 
    DatabaseModule, 
    AuthModule, 
    ScheduleModule.forRoot(),
    TransactionModule, 
    FraudSystemModule, RepositoryModule,
    
  ],
  controllers: [AppController],
  providers: [AppService, GeolocationService, RepositoryService],
})
export class AppModule {}
