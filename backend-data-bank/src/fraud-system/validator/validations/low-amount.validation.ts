import { Injectable, Logger } from '@nestjs/common';
 import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { TransactionValidation } from '../transaction-validation';
import { SuspiciousBehaviour } from 'src/fraud-system/suspicious-behaviours/suspicious-behaviour';
import { LowAmount } from 'src/fraud-system/suspicious-behaviours/impl/low-amount.suspicious-behaviour';

@Injectable()
export class LowAmountValidation extends TransactionValidation {
  private readonly logger = new Logger(LowAmountValidation.name);
  
  // Configurable thresholds
  private readonly MIN_AMOUNT = 10; // Minimum amount threshold
  private readonly MICRO_AMOUNT = 1; // Extremely low amounts (potential testing/probing)
  private readonly VERY_LOW_AMOUNT = 5; // Very suspicious amounts

  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    this.logger.log('START LOW AMOUNT VALIDATION');
    
    try {
      const amount = tx.snapshot?.request?.amount;
      
      // Basic validation
      if (typeof amount !== 'number' || amount <= 0) {
        this.logger.warn('Invalid amount in transaction');
        return [];
      }

      if (amount >= this.MIN_AMOUNT) {
        this.logger.log('PASS - Amount above threshold');
        return [];
      }

      this.logger.log(`SUSPICIOUS - Amount ${amount} below threshold ${this.MIN_AMOUNT}`);
      
      // Create enhanced LowAmount behavior with context
      const behaviour = new LowAmount({
        amount,
        threshold: this.MIN_AMOUNT,
        senderAccount: tx.snapshot.senderAccount?.accountNumber,
        receiverAccount: tx.snapshot.receiverAccount?.accountNumber,
        suspicionLevel: this.calculateSuspicionLevel(amount)
      }, this.calculateIntensityMultiplier(amount));

      return [behaviour];

    } catch (error) {
      this.logger.error(`LowAmountValidation error: ${error?.message || error}`);
      return [];
    }
  }

  private calculateIntensityMultiplier(amount: number): number {
    // Lower amounts = higher intensity
    if (amount <= this.MICRO_AMOUNT) return 2.5; // Very suspicious
    if (amount <= this.VERY_LOW_AMOUNT) return 1.8; // Highly suspicious
    return 1.2; // Moderately suspicious
  }

  private calculateSuspicionLevel(amount: number): 'MICRO' | 'VERY_LOW' | 'LOW' {
    if (amount <= this.MICRO_AMOUNT) return 'MICRO';
    if (amount <= this.VERY_LOW_AMOUNT) return 'VERY_LOW';
    return 'LOW';
  }
}