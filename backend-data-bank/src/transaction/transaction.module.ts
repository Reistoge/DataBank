import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { FraudSystemModule } from '../fraud-system/fraud-system.module';
import { AccountModule } from '../account/account.module';
import { DatabaseModule } from 'src/database/database.module';
import { TransactionWorker } from './transaction.worker';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    forwardRef(() => FraudSystemModule),
    AccountModule,
    DatabaseModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionWorker],
  exports: [TransactionService],
})
export class TransactionModule {}
