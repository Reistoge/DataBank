 import { Inject, Injectable, Logger } from '@nestjs/common';  
import { TransactionDocument } from 'src/transaction/schemas/transaction.schema';
import { TransactionValidation } from './transaction-validation';
import { SuspiciousBehaviour } from '../suspicious-behaviours/suspicious-behaviour';
 
@Injectable() // <-- MAKE IT INJECTABLE
export class TransactionValidator {
  private readonly logger = new Logger(TransactionValidation.name);
  constructor(
    @Inject('TRANSACTION_VALIDATIONS')
    private validations: TransactionValidation[],
  ) {}

  async runAll(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    this.logger.log(`Running all validations`);
    const results = await Promise.all(
      this.validations.map((s) => s.validate(tx)),
    );
    this.logger.log(`finished`);
    return results.flat();
  }
}
