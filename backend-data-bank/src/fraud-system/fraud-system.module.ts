import { Module } from '@nestjs/common';
import { FraudSystemService } from './fraud-system.service';
import { DatabaseModule } from 'src/database/database.module';
import { RepositoryService } from 'src/repository/repository.service';
import { TransactionValidator } from './validator/transaction-validator';
import { RepositoryModule } from 'src/repository/repository.module';
 
@Module({
   imports: [DatabaseModule,RepositoryModule],
   providers: [FraudSystemService, RepositoryService, TransactionValidator],
   exports: [FraudSystemService]
})
export class FraudSystemModule {}
