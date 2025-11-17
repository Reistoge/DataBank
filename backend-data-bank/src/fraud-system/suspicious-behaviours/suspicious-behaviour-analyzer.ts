import { SuspiciousBehaviour } from './suspicious-behaviour';

// Utility class for managing suspicious behaviors
export class SuspiciousBehaviourAnalyzer {
  static calculateRiskScore(behaviors: SuspiciousBehaviour[]): number {
    if (behaviors.length === 0) return 0;

    // Sum weighted scores
    const totalWeight = behaviors.reduce((sum, b) => sum + b.weight, 0);

    // Diversity bonus: more behavior types = higher risk
    const uniqueBehaviors = new Set(behaviors.map((b) => b.code)).size;
    const diversityMultiplier = 1 + (uniqueBehaviors - 1) * 0.1; // +10% per additional behavior type

    // Critical behavior override
    const hasCritical = behaviors.some((b) => b.baseSeverity === 'CRITICAL');
    if (hasCritical)
      return Math.min(1.0, totalWeight * diversityMultiplier * 1.5);

    return Math.min(1.0, totalWeight * diversityMultiplier);
  }

  static getRecommendation(riskScore: number): 'APPROVE' | 'REVIEW' | 'BLOCK' {
    if (riskScore >= 0.8) return 'BLOCK';
    if (riskScore >= 0.4) return 'REVIEW';
    return 'APPROVE';
  }

  static getHighestSeverity(
    behaviors: SuspiciousBehaviour[],
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | number {
    let highest = 0;
    let highestString: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    for (const behavior of behaviors) {
      if (typeof behavior.severity === 'number') {
        highest = Math.max(highest, behavior.severity);
      } else {
        const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 5 };
        const value = severityOrder[behavior.severity];
        if (value > highest) {
          highest = value;
          highestString = behavior.severity;
        }
      }
    }

    return highest > 0 ? highest : highestString;
  }
}
