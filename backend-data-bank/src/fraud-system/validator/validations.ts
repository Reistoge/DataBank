import { Injectable, Logger } from '@nestjs/common'; // <-- ADD @Injectable
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { LowAmount, SuspiciousBehaviour } from "../dto/fraud.dto";
import { TransactionValidation } from "./transaction-validation";

@Injectable()
export class LowAmountValidation extends TransactionValidation {

  private readonly logger = new Logger(LowAmountValidation.name);
  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    this.logger.log(`START LOW AMOUNT VALIDATION`);
    const MIN_AMOUNT = 10;
    if (tx.snapshot.request.amount < MIN_AMOUNT) {
      this.logger.log(`SUSPICIOUS`);
      return [new LowAmount()];
    }
    
    this.logger.log(`PASS`);
    return [];
  }
}


// EXAMPLE: If you had another validation that needed AccountService:
/*
@Injectable()
export class HighBalanceValidation extends TransactionValidation {
  constructor(private accountService: AccountService) {
    super();
  }

  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    const balance = await this.accountService.getAccountBalanceByAccountNumber(tx.snapshot.senderAccount.accountNumber);
    if (balance > 1000000) {
      // return [new HighBalanceBehaviour()];
    }
    return [];
  }
}
*/

