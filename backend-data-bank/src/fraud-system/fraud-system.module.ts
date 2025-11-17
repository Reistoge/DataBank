// backend-data-bank/src/fraud-system/fraud-system.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TransactionValidator } from './validator/transaction-validator';
import { AccountModule } from 'src/account/account.module';
import { CardModule } from 'src/card/card.module';

import { TransactionValidation } from './validator/transaction-validation';
import { FraudSystemService } from './fraud-system.service';
import { LowAmountValidation } from './validator/validations/low-amount.validation';
import { AccountDrainValidation } from './validator/validations/account-drain.validation';
import { GeoDistanceValidation } from './validator/validations/geo-distance.validation';
import { TransactionService } from 'src/transaction/transaction.service';
import { TransactionModule } from 'src/transaction/transaction.module';
import { GeolocationService } from 'src/geolocation/geolocation.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction } from 'nest-neo4j/dist';
import { TransactionSchema } from 'src/transaction/schemas/transaction.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
   imports: [
      HttpModule,
      DatabaseModule,
      CardModule,
      AccountModule,
      MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
      forwardRef(() => TransactionModule)
   ],
   providers: [
      FraudSystemService,
      TransactionService,
      GeolocationService,
      TransactionValidator,
      LowAmountValidation,
      AccountDrainValidation,
      GeoDistanceValidation,

      // Factory provider approach - more explicit and type-safe
      {
         provide: 'TRANSACTION_VALIDATIONS',
         useFactory: (
            lowAmountValidation: LowAmountValidation,
            accountDrainValidation: AccountDrainValidation,
            geoDistanceValidation: GeoDistanceValidation
         ) => [
            lowAmountValidation,
            accountDrainValidation,
            geoDistanceValidation,
         ],
         inject: [LowAmountValidation, AccountDrainValidation, GeoDistanceValidation],
      },
   ],
   exports: [FraudSystemService]
})
export class FraudSystemModule { }