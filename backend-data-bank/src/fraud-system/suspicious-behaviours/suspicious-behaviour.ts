
export abstract class SuspiciousBehaviour {
    abstract readonly code: string;
    abstract readonly baseWeight: number; // Fixed base weight per behavior type
    abstract readonly baseSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    abstract readonly description: string;

    // Dynamic properties that can be overridden
    intensityMultiplier: number = 1.0; // 0.1 to 3.0 range
    dynamicSeverity?: number; // 1-5 scale, overrides baseSeverity if set
    readonly detectedAt: Date = new Date();
    readonly context?: Record<string, any>;

    constructor(context?: Record<string, any>, intensityMultiplier: number = 1.0) {
        this.context = context;
        this.intensityMultiplier = Math.max(0.1, Math.min(3.0, intensityMultiplier)); // Clamp 0.1-3.0
    }

    // Computed properties
    get weight(): number {
        return this.baseWeight * this.intensityMultiplier;
    }

    get severity(): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | number {
        return this.dynamicSeverity ?? this.baseSeverity;
    }

    getExplanation(): string {
        return `${this.description} (Weight: ${this.weight.toFixed(2)}, Severity: ${this.severity}, Intensity: ${this.intensityMultiplier.toFixed(2)})`;
    }
}