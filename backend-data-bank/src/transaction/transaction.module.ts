import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { FraudSystemService } from 'src/fraud-system/fraud-system.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, FraudSystemService],
})
export class TransactionModule {}
