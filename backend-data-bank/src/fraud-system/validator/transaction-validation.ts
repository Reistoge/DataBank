import { Injectable } from '@nestjs/common'; // <-- ADD @Injectable
import { TransactionDocument } from 'src/transaction/schemas/transaction.schema';
import { SuspiciousBehaviour } from '../suspicious-behaviours/suspicious-behaviour';

@Injectable()
export abstract class TransactionValidation {
  abstract validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]>;
}
