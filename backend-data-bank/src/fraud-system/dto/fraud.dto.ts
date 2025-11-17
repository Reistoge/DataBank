import { PredictionOutput } from './prediction.dto';
import { SuspiciousBehaviour } from '../suspicious-behaviours/suspicious-behaviour';

export class FraudResult {
  isFraud: boolean;
  probabilitySuspicious: number;
  behaviours: SuspiciousBehaviour[];
  recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK'; // Action recommendation
}

export class AccountDrain extends SuspiciousBehaviour {
  readonly code = 'ACCOUNT_DRAIN';
  readonly baseWeight = 0.3;
  readonly baseSeverity = 'HIGH' as const;
  readonly description =
    'Transaction drains significant portion of account balance';
}

export class ReceiverCategoryTypeMismatch extends SuspiciousBehaviour {
  readonly code = 'RECEIVER_TYPE_MISMATCH';
  readonly baseWeight = 0.2;
  readonly baseSeverity = 'MEDIUM' as const;
  readonly description =
    "Receiver account type doesn't match expected category";
}

export class ReceiverCategoryAmountMismatch extends SuspiciousBehaviour {
  readonly code = 'RECEIVER_AMOUNT_MISMATCH';
  readonly baseWeight = 0.2;
  readonly baseSeverity = 'MEDIUM' as const;
  readonly description =
    "Transaction amount doesn't match receiver's typical transactions";
}

export class ReceiverFirstTransaction extends SuspiciousBehaviour {
  readonly code = 'RECEIVER_FIRST_TX';
  readonly baseWeight = 0.1;
  readonly baseSeverity = 'LOW' as const;
  readonly description = "This is the receiver's first transaction";
}

export class SenderFirstTransaction extends SuspiciousBehaviour {
  readonly code = 'SENDER_FIRST_TX';
  readonly baseWeight = 0.1; // Fixed typo: was "weigth"
  readonly baseSeverity = 'LOW' as const;
  readonly description = "This is the sender's first transaction";
}

export class HighDifferenceBetweenAccountBalances extends SuspiciousBehaviour {
  readonly code = 'BALANCE_MISMATCH';
  readonly baseWeight = 0.3;
  readonly baseSeverity = 'HIGH' as const;
  readonly description =
    'Large difference between sender and receiver account balances';
}

export class UnusualTimePattern extends SuspiciousBehaviour {
  readonly code = 'UNUSUAL_TIME';
  readonly baseWeight = 0.2;
  readonly baseSeverity = 'MEDIUM' as const;
  readonly description = 'Transaction at unusual time (outside normal hours)';
}

export class RoundAmountTransaction extends SuspiciousBehaviour {
  readonly code = 'ROUND_AMOUNT';
  readonly baseWeight = 0.15;
  readonly baseSeverity = 'LOW' as const;
  readonly description = 'Transaction amount is suspiciously round number';
}

export class CrossBorderTransaction extends SuspiciousBehaviour {
  readonly code = 'CROSS_BORDER';
  readonly baseWeight = 0.25;
  readonly baseSeverity = 'MEDIUM' as const;
  readonly description = 'Transaction crosses international borders';
}

export class BlacklistedReceiver extends SuspiciousBehaviour {
  readonly code = 'BLACKLISTED_RECEIVER';
  readonly baseWeight = 0.8;
  readonly baseSeverity = 'CRITICAL' as const;
  readonly description = 'Receiver is on suspicious accounts list';
}

export class StructuredTransaction extends SuspiciousBehaviour {
  readonly code = 'STRUCTURED_TX';
  readonly baseWeight = 0.6;
  readonly baseSeverity = 'CRITICAL' as const;
  readonly description =
    'Transaction appears to be structured to avoid reporting thresholds';
}
