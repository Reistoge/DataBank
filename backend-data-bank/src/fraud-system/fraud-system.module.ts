// backend-data-bank/src/fraud-system/fraud-system.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TransactionValidator } from './validator/transaction-validator';
import { AccountModule } from 'src/account/account.module'; 
import { CardModule } from 'src/card/card.module'; 
import { LowAmountValidation } from './validator/validations'; 
import { TransactionValidation } from './validator/transaction-validation'; 
import { FraudSystemService } from './fraud-system.service';


//This tells Nest: "Build an array for the token TransactionValidation,
//  and add LowAmountValidation to it." Then, the TransactionValidator constructor says: "Give me that array you just built.

// This array holds all our validation rule providers
const validationProviders = [
   LowAmountValidation,
   // Add your other validation classes here
   // e.g., HighBalanceValidation,
];

@Module({
   imports: [
      DatabaseModule,
      AccountModule, 
      CardModule, 
   ],
   providers: [
      FraudSystemService,
      TransactionValidator,
      // Use a "multi-provider" token.
      // This tells Nest that all providers in the array
      // should be injected whenever "TransactionValidation" is requested.
      {
         provide: TransactionValidation,
         useExisting: LowAmountValidation,
      },
      // ...add one for each validation
      ...validationProviders,
   ],
   exports: [FraudSystemService]
})
export class FraudSystemModule { }