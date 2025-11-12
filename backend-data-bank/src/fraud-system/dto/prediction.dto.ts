import { SuspiciousBehaviour } from "../suspicious-behaviours/suspicious-behaviour"


export class PredictionInput{
 

}
export class PredictionOutput{
    prediction: number  
    probabilitySuspicious: number
    behaviours: SuspiciousBehaviour[]
 }   