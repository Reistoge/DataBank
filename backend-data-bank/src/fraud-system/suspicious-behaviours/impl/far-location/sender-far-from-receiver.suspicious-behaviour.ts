import { SuspiciousBehaviour } from "../../suspicious-behaviour";

 export class SenderFarFromReceiver extends SuspiciousBehaviour {
     readonly baseWeight = 0.35;
     readonly code = 'SENDER_FAR_FROM_RECEIVER';
     readonly baseSeverity = 'HIGH' as const;
     description: string;
 
     constructor(context: {
         distance: number;
         [key: string]: any;
     }) {
         // International transfers are inherently more suspicious
         const intensity = Math.min(3.0, Math.max(0.8, context.distance / 2000)); // 2000km -> intensity 1.0
 
         super(context, intensity);
 
         this.description = `Sender and receiver are geographically distant. Distance: ${context.distance.toFixed(0)}km`;
 
         this.dynamicSeverity = Math.round(Math.min(5, Math.max(2,
             Math.log10(context.distance / 100) + 2 // 1000km -> 3, 10000km -> 4
         )));
     }
 }
 