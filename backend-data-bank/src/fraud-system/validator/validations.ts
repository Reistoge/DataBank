import { Injectable } from '@nestjs/common'; // <-- ADD @Injectable
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { LowAmount, SuspiciousBehaviour } from "../dto/fraud.dto";
import { TransactionValidation } from "./transaction-validation";

@Injectable()
export class LowAmountValidation extends TransactionValidation {


  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    const MIN_AMOUNT = 10;

    if (tx.snapshot.request.amount < MIN_AMOUNT) {
      return [new LowAmount()];
    }

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

