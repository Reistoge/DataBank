import { SuspiciousBehaviour } from 'src/fraud-system/suspicious-behaviours/suspicious-behaviour';

export class HighFrequencyTransactions extends SuspiciousBehaviour {
  readonly baseWeight = 0.3;
  readonly code = 'HIGH_FREQUENCY';
  readonly baseSeverity = 'MEDIUM' as const;
  description: string;

  constructor(context: {
    z: number;
    rateFold: number;
    windowCount: number;
    baselineMedian: number;
    [key: string]: any;
  }) {
    // Calculate intensity based on anomaly strength
    const zIntensity = Math.min(2.0, Math.max(0.5, Math.abs(context.z) / 3)); // z=3 -> 1.0, z=6 -> 2.0
    const rateIntensity = Math.min(
      2.0,
      Math.max(0.5, (context.rateFold - 1) / 2),
    ); // rateFold=3 -> 1.0, rateFold=5 -> 2.0
    const intensity = Math.max(zIntensity, rateIntensity); // Take the stronger signal

    super(context, intensity);

    this.description = `High transaction frequency detected. z=${context.z.toFixed(2)}, rateFold=${context.rateFold.toFixed(2)}, windowCount=${context.windowCount}`;

    // Dynamic severity: 1-5 based on combined signals
    this.dynamicSeverity = Math.round(
      Math.min(
        5,
        Math.max(
          1,
          (Math.abs(context.z) / 3) * 2 + (context.rateFold > 1 ? 1 : 0) + 1,
        ),
      ),
    );
  }
}
