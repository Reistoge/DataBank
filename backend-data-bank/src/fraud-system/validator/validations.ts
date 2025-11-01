import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { LowAmount, SuspiciousBehaviour } from "../dto/fraud.dto";
import { TransactionValidation } from "./transaction-validation";

export class LowAmountValidation extends TransactionValidation {
  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    const MIN_AMOUNT = 10; // Set appropriate threshold
    
    if (tx.snapshot.request.amount < MIN_AMOUNT) {
      // return [{
      //   type: 'LOW_AMOUNT',
      //   severity: 'LOW',
      //   description: `Transaction amount ${tx.snapshot.request.amount} is unusually low`,
      // }];
      return [new LowAmount()];
    }
    
    return [];
  }
}

