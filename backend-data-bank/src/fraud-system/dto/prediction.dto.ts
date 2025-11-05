import { SuspiciousBehaviour } from "./fraud.dto"

export class PredictionInput{
 

}
export class PredictionOutput{
    prediction: number  
    probabilitySuspicious: number
    behaviours: SuspiciousBehaviour[]
 }   