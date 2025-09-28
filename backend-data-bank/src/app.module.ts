import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Add this import
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CardModule } from './card/card.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Add this line
    DatabaseModule, 
    UsersModule, 
    AuthModule, CardModule, TransactionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
