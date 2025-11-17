import { Inject, Injectable, Logger } from '@nestjs/common';
import { SuspiciousBehaviour } from 'src/fraud-system/suspicious-behaviours/suspicious-behaviour';
import { AccountDrain } from 'src/fraud-system/suspicious-behaviours/impl/account-drain.suspicious-behaviour';
import { TransactionDocument } from 'src/transaction/schemas/transaction.schema';
import { TransactionValidation } from '../transaction-validation';
import { AccountService } from 'src/account/account.service';

@Injectable()
export class AccountDrainValidation extends TransactionValidation {
  constructor(@Inject() private accountService: AccountService) {
    super();
  }

  private readonly logger = new Logger(AccountDrainValidation.name);

  // Configurable thresholds (percentages)
  private readonly MODERATE_DRAIN_THRESHOLD = 0.5; // 50% of balance
  private readonly HIGH_DRAIN_THRESHOLD = 0.75; // 75% of balance
  private readonly EXTREME_DRAIN_THRESHOLD = 0.9; // 90% of balance
  private readonly MINIMUM_BALANCE_CHECK = 100; // Only check if balance > 100 (avoid false positives on small amounts)

  async validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
    this.logger.log('START ACCOUNT DRAIN VALIDATION');

    try {
      const snapshot = tx.snapshot;
      if (!snapshot?.request) {
        this.logger.warn(
          'AccountDrainValidation: missing transaction snapshot',
        );
        return [];
      }

      const { amount, senderAccountNumber } = snapshot.request;

      // Basic validation
      if (typeof amount !== 'number' || amount <= 0) {
        this.logger.warn(
          'AccountDrainValidation: invalid amount in transaction',
        );
        return [];
      }

      if (!senderAccountNumber) {
        this.logger.warn(
          'AccountDrainValidation: missing sender account number',
        );
        return [];
      }

      // Get current account balance
      const currentBalance = await this.getCurrentAccountBalance(
        senderAccountNumber,
        snapshot,
      );

      if (currentBalance === null) {
        this.logger.warn(
          `AccountDrainValidation: could not get balance for account ${senderAccountNumber}`,
        );
        return [];
      }

      // Skip validation for very small balances to avoid false positives
      if (currentBalance < this.MINIMUM_BALANCE_CHECK) {
        this.logger.log(
          `AccountDrainValidation: balance too small (${currentBalance}) for meaningful drain analysis`,
        );
        return [];
      }

      // Calculate drain metrics
      const drainAnalysis = this.analyzeDrain(amount, currentBalance);

      this.logger.log(
        `AccountDrainValidation: ${JSON.stringify(drainAnalysis)}`,
      );

      // Check if drain is suspicious
      if (drainAnalysis.drainPercentage >= this.MODERATE_DRAIN_THRESHOLD) {
        const behaviour = new AccountDrain(
          {
            amount: drainAnalysis.amount,
            balance: drainAnalysis.balance,
            drainPercentage: drainAnalysis.drainPercentage * 100, // Convert to percentage
            remainingBalance: drainAnalysis.remainingBalance,
            drainLevel: drainAnalysis.drainLevel,
            senderAccount: senderAccountNumber,
          },
          this.calculateIntensityMultiplier(drainAnalysis.drainPercentage),
        );

        this.logger.log(
          `AccountDrain detected: ${drainAnalysis.drainLevel} - ${(drainAnalysis.drainPercentage * 100).toFixed(1)}%`,
        );
        return [behaviour];
      }

      this.logger.log('PASS - Account drain within acceptable limits');
      return [];
    } catch (error) {
      this.logger.error(
        `AccountDrainValidation error: ${error?.message || error}`,
      );
      return [];
    }
  }

  private async getCurrentAccountBalance(
    senderAccountNumber: string,
    snapshot: any,
  ): Promise<number | null> {
    try {
      // Try to get balance from snapshot first (more accurate as it's the balance at transaction time)
      if (
        snapshot.senderAccount?.balance !== undefined &&
        snapshot.senderAccount.balance !== null
      ) {
        return snapshot.senderAccount.balance;
      }

      // Fallback to current balance from account service
      return await this.accountService.getAccountBalanceByAccountNumber(
        senderAccountNumber,
      );
    } catch (error) {
      this.logger.error(`Failed to get account balance: ${error?.message}`);
      return null;
    }
  }

  private analyzeDrain(
    amount: number,
    balance: number,
  ): {
    amount: number;
    balance: number;
    drainPercentage: number;
    remainingBalance: number;
    drainLevel: 'MODERATE' | 'HIGH' | 'EXTREME';
  } {
    const drainPercentage = amount / balance;
    const remainingBalance = balance - amount;

    let drainLevel: 'MODERATE' | 'HIGH' | 'EXTREME';
    if (drainPercentage >= this.EXTREME_DRAIN_THRESHOLD) {
      drainLevel = 'EXTREME';
    } else if (drainPercentage >= this.HIGH_DRAIN_THRESHOLD) {
      drainLevel = 'HIGH';
    } else {
      drainLevel = 'MODERATE';
    }

    return {
      amount,
      balance,
      drainPercentage,
      remainingBalance,
      drainLevel,
    };
  }

  private calculateIntensityMultiplier(drainPercentage: number): number {
    // Higher drain percentage = higher intensity
    if (drainPercentage >= this.EXTREME_DRAIN_THRESHOLD) return 2.8; // 90%+ = very suspicious
    if (drainPercentage >= this.HIGH_DRAIN_THRESHOLD) return 2.2; // 75%+ = highly suspicious
    if (drainPercentage >= this.MODERATE_DRAIN_THRESHOLD) return 1.5; // 50%+ = moderately suspicious
    return 1.0; // Default
  }
}
