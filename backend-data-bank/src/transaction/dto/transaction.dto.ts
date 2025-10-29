import { PartialType } from "@nestjs/mapped-types";
import { Prop } from "@nestjs/mongoose";
import { PredictionInput, PredictionOutput } from "src/fraud-system/dto/prediction.dto";

export class TransactionSnapshot {

    @Prop({required:true})
    isFraud:boolean

    @Prop({ required: true })
    amount: number

    @Prop({ required: true })
    accountBalance: number

    @Prop({ required: true, default: "" })
    description: string

    @Prop({ required: true, default: "" })
    receiverContact: string

    @Prop({ required: true })
    transactionType: string

    @Prop({ required: true })
    merchantCategory: string

    @Prop({ required: true })
    location: string

    @Prop({ required: true })
    device: string

    @Prop({ required: true })
    currency: string

    @Prop({ required: true })
    ipAddress: string

    @Prop()
    predictionInput: PredictionInput

    @Prop()
    predictionOutput: PredictionOutput


}

export class TransactionRequestDto {

}
export class TransactionResponseDto{

}
export class UpdateTransactionDto extends PartialType(TransactionRequestDto) {}
