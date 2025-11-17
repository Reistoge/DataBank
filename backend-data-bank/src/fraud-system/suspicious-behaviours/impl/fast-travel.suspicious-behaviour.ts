import { SuspiciousBehaviour } from "../suspicious-behaviour";

export class FastTravel extends SuspiciousBehaviour {
    readonly baseWeight = 0.4;
    readonly code = 'FAST_TRAVEL';
    readonly baseSeverity = 'HIGH' as const;
    description: string;

    constructor(context: {
        distance: number;
        timeGap: number;
        requiredSpeed: number;
        maxHumanSpeed?: number;
        [key: string]: any;
    }) {
        // Calculate intensity based on how impossible the travel is
        const maxHumanSpeed = context.maxHumanSpeed || 900; // km/h (commercial airplane)
        const speedRatio = context.requiredSpeed / maxHumanSpeed;
        const intensity = Math.min(3.0, Math.max(1.0, speedRatio)); // Impossible travel gets high intensity

        super(context, intensity);

        this.description = `Impossible travel detected. Required speed: ${context.requiredSpeed.toFixed(0)}km/h over ${context.timeGap.toFixed(1)}h for ${context.distance.toFixed(0)}km`;

        // Dynamic severity based on impossibility level
        this.dynamicSeverity = Math.round(Math.min(5, Math.max(3,
            speedRatio > 2 ? 5 : (speedRatio > 1.5 ? 4 : 3)
        )));
    }
}