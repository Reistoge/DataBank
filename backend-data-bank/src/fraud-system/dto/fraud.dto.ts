import { PredictionOutput } from "./prediction.dto";

export class FraudResult {

    predictionOutput: PredictionOutput
    isFraud: boolean
    cause: SuspiciousBehaviour[]
}
export abstract class SuspiciousBehaviour {
    abstract readonly weight: number;
}

 
export class LowAmount extends SuspiciousBehaviour {
    readonly weight = 0.1;
}

export class TxFarFromReceiver extends SuspiciousBehaviour {
    readonly weight = .2;

}
export class TxFarFromSender extends SuspiciousBehaviour {
    readonly weight = .2;

}
export class AccountDrain extends SuspiciousBehaviour {
    readonly weight: .3;
}
export class HighDifferenceBetweenAccountBalances {
    readonly weight: .3;
}
export class ReceiverCategoryTypeMismatch {
    readonly weight: .2;

}
export class ReceiverCategoryAmountMismatch {
    readonly weight: .2;
}
export class ReceiverFirstTransaction{
    readonly weight: .1;
}
export class SenderFirstTransaction{
    readonly weigth: .1;
}
