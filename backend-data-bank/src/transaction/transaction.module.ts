import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { FraudSystemService } from 'src/fraud-system/fraud-system.service';
import { TransactionWorker } from './transaction.worker';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Transaction } from 'nest-neo4j/dist';
import { AccountModule } from 'src/account/account.module';
import { FraudSystemModule } from 'src/fraud-system/fraud-system.module';
import { TransactionSchema } from './schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    ScheduleModule.forRoot(),
    AccountModule,
    FraudSystemModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionWorker],
  exports: [TransactionService],
})
export class TransactionModule {}