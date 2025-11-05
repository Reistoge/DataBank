// backend-data-bank/src/fraud-system/fraud-system.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TransactionValidator } from './validator/transaction-validator';
import { AccountModule } from 'src/account/account.module'; 
import { CardModule } from 'src/card/card.module'; 
import { LowAmountValidation } from './validator/validations'; 
import { TransactionValidation } from './validator/transaction-validation'; 
import { FraudSystemService } from './fraud-system.service';

@Module({
   imports: [
      DatabaseModule,
      AccountModule, 
      CardModule, 
   ],
   providers: [
      FraudSystemService,
      TransactionValidator,
      LowAmountValidation,
      // Factory provider approach - more explicit and type-safe
      {
         provide: 'TRANSACTION_VALIDATIONS',
         useFactory: (lowAmountValidation: LowAmountValidation) => [
            lowAmountValidation,
            // Add more validations here
         ],
         inject: [LowAmountValidation],
      },
   ],
   exports: [FraudSystemService]
})
export class FraudSystemModule { }