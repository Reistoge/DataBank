import { SuspiciousBehaviour } from '../../suspicious-behaviour';

export class TxFarFromSender extends SuspiciousBehaviour {
  readonly baseWeight = 0.25;
  readonly code = 'TX_FAR_FROM_SENDER';
  readonly baseSeverity = 'MEDIUM' as const;
  description: string;

  constructor(context: {
    distance: number;
    avgDistance?: number;
    [key: string]: any;
  }) {
    // Calculate intensity based on distance anomaly
    const avgDist = context.avgDistance || 100; // fallback average
    const distanceRatio = context.distance / avgDist;
    const intensity = Math.min(2.5, Math.max(0.5, distanceRatio / 2)); // distance 2x avg -> intensity 1.0

    super(context, intensity);

    this.description = `Transaction location is far from sender's typical location. Distance: ${context.distance.toFixed(0)}km`;

    // Dynamic severity based on distance
    this.dynamicSeverity = Math.round(
      Math.min(
        5,
        Math.max(
          1,
          Math.log10(context.distance / 10) + 1, // 100km -> 2, 1000km -> 3, 10000km -> 4
        ),
      ),
    );
  }
}
