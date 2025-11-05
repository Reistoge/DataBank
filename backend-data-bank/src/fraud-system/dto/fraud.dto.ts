import { PredictionOutput } from "./prediction.dto";

export class FraudResult {
    isFraud: boolean
    probabilitySuspicious: number
    behaviours: SuspiciousBehaviour[]
    recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK' // Action recommendation
}

export abstract class SuspiciousBehaviour {
    abstract readonly weight: number;
    abstract readonly code: string; // Unique identifier
    abstract readonly description: string; // Human-readable description
    abstract readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Risk level
    
    // Context data that triggered this behavior
    readonly detectedAt: Date = new Date();
    readonly context?: Record<string, any>; // Additional context data
    
    constructor(context?: Record<string, any>) {
        this.context = context;
    }
    
    // Method to get detailed explanation
    getExplanation(): string {
        return `${this.description} (Weight: ${this.weight}, Severity: ${this.severity})`;
    }
}

export class LowAmount extends SuspiciousBehaviour {
    readonly weight = 0.1;
    readonly code = 'LOW_AMOUNT';
    readonly description = 'Transaction amount is unusually low';
    readonly severity = 'LOW' as const;
}

export class TxFarFromReceiver extends SuspiciousBehaviour {
    readonly weight = 0.2;
    readonly code = 'FAR_FROM_RECEIVER';
    readonly description = 'Transaction location is far from receiver\'s usual location';
    readonly severity = 'MEDIUM' as const;
}

export class TxFarFromSender extends SuspiciousBehaviour {
    readonly weight = 0.2;
    readonly code = 'FAR_FROM_SENDER';
    readonly description = 'Transaction location is far from sender\'s usual location';
    readonly severity = 'MEDIUM' as const;
}

export class AccountDrain extends SuspiciousBehaviour {
    readonly weight = 0.3;
    readonly code = 'ACCOUNT_DRAIN';
    readonly description = 'Transaction drains significant portion of account balance';
    readonly severity = 'HIGH' as const;
}

export class HighDifferenceBetweenAccountBalances extends SuspiciousBehaviour {
    readonly weight = 0.3;
    readonly code = 'BALANCE_MISMATCH';
    readonly description = 'Large difference between sender and receiver account balances';
    readonly severity = 'HIGH' as const;
}

export class ReceiverCategoryTypeMismatch extends SuspiciousBehaviour {
    readonly weight = 0.2;
    readonly code = 'RECEIVER_TYPE_MISMATCH';
    readonly description = 'Receiver account type doesn\'t match expected category';
    readonly severity = 'MEDIUM' as const;
}

export class ReceiverCategoryAmountMismatch extends SuspiciousBehaviour {
    readonly weight = 0.2;
    readonly code = 'RECEIVER_AMOUNT_MISMATCH';
    readonly description = 'Transaction amount doesn\'t match receiver\'s typical transactions';
    readonly severity = 'MEDIUM' as const;
}

export class ReceiverFirstTransaction extends SuspiciousBehaviour {
    readonly weight = 0.1;
    readonly code = 'RECEIVER_FIRST_TX';
    readonly description = 'This is the receiver\'s first transaction';
    readonly severity = 'LOW' as const;
}

export class SenderFirstTransaction extends SuspiciousBehaviour {
    readonly weight = 0.1; // Fixed typo: was "weigth"
    readonly code = 'SENDER_FIRST_TX';
    readonly description = 'This is the sender\'s first transaction';
    readonly severity = 'LOW' as const;
}

// Additional suspicious behaviors you might want to add:

export class HighFrequencyTransactions extends SuspiciousBehaviour {
    readonly weight = 0.4;
    readonly code = 'HIGH_FREQUENCY';
    readonly description = 'Multiple transactions in short time period';
    readonly severity = 'HIGH' as const;
}

export class UnusualTimePattern extends SuspiciousBehaviour {
    readonly weight = 0.2;
    readonly code = 'UNUSUAL_TIME';
    readonly description = 'Transaction at unusual time (outside normal hours)';
    readonly severity = 'MEDIUM' as const;
}

export class RoundAmountTransaction extends SuspiciousBehaviour {
    readonly weight = 0.15;
    readonly code = 'ROUND_AMOUNT';
    readonly description = 'Transaction amount is suspiciously round number';
    readonly severity = 'LOW' as const;
}

export class VelocityAnomaly extends SuspiciousBehaviour {
    readonly weight = 0.35;
    readonly code = 'VELOCITY_ANOMALY';
    readonly description = 'Transaction velocity exceeds normal patterns';
    readonly severity = 'HIGH' as const;
}

export class CrossBorderTransaction extends SuspiciousBehaviour {
    readonly weight = 0.25;
    readonly code = 'CROSS_BORDER';
    readonly description = 'Transaction crosses international borders';
    readonly severity = 'MEDIUM' as const;
}

export class BlacklistedReceiver extends SuspiciousBehaviour {
    readonly weight = 0.8;
    readonly code = 'BLACKLISTED_RECEIVER';
    readonly description = 'Receiver is on suspicious accounts list';
    readonly severity = 'CRITICAL' as const;
}

export class StructuredTransaction extends SuspiciousBehaviour {
    readonly weight = 0.6;
    readonly code = 'STRUCTURED_TX';
    readonly description = 'Transaction appears to be structured to avoid reporting thresholds';
    readonly severity = 'CRITICAL' as const;
}

// Utility class for managing suspicious behaviors
export class SuspiciousBehaviourAnalyzer {
    
    static calculateRiskScore(behaviors: SuspiciousBehaviour[]): number {
        return behaviors.reduce((total, behavior) => total + behavior.weight, 0);
    }
    
    static getRecommendation(riskScore: number): 'APPROVE' | 'REVIEW' | 'BLOCK' {
        if (riskScore >= 0.7) return 'BLOCK';
        if (riskScore >= 0.4) return 'REVIEW';
        return 'APPROVE';
    }
    
    static getHighestSeverity(behaviors: SuspiciousBehaviour[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        
        return behaviors.reduce((highest, behavior) => {
            return severityOrder[behavior.severity] > severityOrder[highest] 
                ? behavior.severity 
                : highest;
        }, 'LOW' as const);
    }
    
    static generateReport(behaviors: SuspiciousBehaviour[]): string {
        const riskScore = this.calculateRiskScore(behaviors);
        const recommendation = this.getRecommendation(riskScore);
        const severity = this.getHighestSeverity(behaviors);
        
        return `
            Risk Analysis Report:
            - Total Risk Score: ${riskScore.toFixed(2)}
            - Highest Severity: ${severity}
            - Recommendation: ${recommendation}
            - Detected Behaviors: ${behaviors.length}
            
            Details:
            ${behaviors.map(b => `  • ${b.getExplanation()}`).join('\n')}
        `;
    }
}