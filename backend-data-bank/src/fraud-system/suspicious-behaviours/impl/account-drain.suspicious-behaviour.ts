import { SuspiciousBehaviour } from '../suspicious-behaviour';

export class AccountDrain extends SuspiciousBehaviour {
  readonly code = 'ACCOUNT_DRAIN';
  readonly baseWeight = 0.4;
  readonly baseSeverity = 'HIGH' as const;
  description: string;

  constructor(
    context?: {
      amount?: number;
      balance?: number;
      drainPercentage?: number;
      remainingBalance?: number;
      drainLevel?: 'MODERATE' | 'HIGH' | 'EXTREME';
      [key: string]: any;
    },
    intensityMultiplier: number = 1.0,
  ) {
    super(context, intensityMultiplier);

    const amount = context?.amount || 0;
    const balance = context?.balance || 0;
    const drainPercentage = context?.drainPercentage || 0;
    const remainingBalance = context?.remainingBalance || 0;
    const drainLevel = context?.drainLevel || 'MODERATE';

    this.description = `Transaction drains ${drainPercentage.toFixed(1)}% of account balance (${amount}/${balance}). Remaining: ${remainingBalance}. Level: ${drainLevel}`;

    // Dynamic severity based on how much of the balance is being drained
    const severityMap = { MODERATE: 3, HIGH: 4, EXTREME: 5 };
    this.dynamicSeverity = severityMap[drainLevel] || 3;
  }
}
