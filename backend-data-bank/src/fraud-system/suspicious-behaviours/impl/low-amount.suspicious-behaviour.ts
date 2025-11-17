import { SuspiciousBehaviour } from '../suspicious-behaviour';

export class LowAmount extends SuspiciousBehaviour {
  readonly code = 'LOW_AMOUNT';
  readonly baseWeight = 0.1;
  readonly baseSeverity = 'LOW' as const;
  description: string;

  constructor(
    context?: {
      amount?: number;
      threshold?: number;
      senderAccount?: string;
      receiverAccount?: string;
      suspicionLevel?: 'MICRO' | 'VERY_LOW' | 'LOW';
      [key: string]: any;
    },
    intensityMultiplier: number = 1.0,
  ) {
    super(context, intensityMultiplier);

    const amount = context?.amount || 0;
    const threshold = context?.threshold || 10;
    const suspicionLevel = context?.suspicionLevel || 'LOW';

    this.description = `Transaction amount (${amount}) is unusually low (threshold: ${threshold}). Suspicion level: ${suspicionLevel}`;

    // Dynamic severity based on how low the amount is
    const severityMap = { MICRO: 4, VERY_LOW: 3, LOW: 2 };
    this.dynamicSeverity = severityMap[suspicionLevel] || 2;
  }
}
