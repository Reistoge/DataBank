import { SuspiciousBehaviour } from '../../suspicious-behaviour';

export class TxFarFromReceiver extends SuspiciousBehaviour {
  readonly baseWeight = 0.25;
  readonly code = 'TX_FAR_FROM_RECEIVER';
  readonly baseSeverity = 'MEDIUM' as const;
  description: string;

  constructor(context: {
    distance: number;
    avgDistance?: number;
    [key: string]: any;
  }) {
    const avgDist = context.avgDistance || 100;
    const distanceRatio = context.distance / avgDist;
    const intensity = Math.min(2.5, Math.max(0.5, distanceRatio / 2));

    super(context, intensity);

    this.description = `Transaction location is far from receiver's typical location. Distance: ${context.distance.toFixed(0)}km`;

    this.dynamicSeverity = Math.round(
      Math.min(5, Math.max(1, Math.log10(context.distance / 10) + 1)),
    );
  }
}
