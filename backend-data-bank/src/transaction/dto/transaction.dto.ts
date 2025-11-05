import { PartialType } from '@nestjs/mapped-types';
import { Account } from "src/account/schemas/account.schema"
import { FraudResult } from 'src/fraud-system/dto/fraud.dto';
import { PredictionInput } from "src/fraud-system/dto/prediction.dto"

/**
 * @Def
 * A screenshoot of the transaction request scene.
 * 
 * @Usage
 * Use it to store the entire entities and data involucred 
 * in the process of transaction creation, validation and result 
 */ 
export class TransactionSnapshot {

    isFraud: boolean
    senderAccount : Account
    receiverAccount: Account
    request: TransactionRequestDto  
    
    predictionInput?: PredictionInput
    fraudResult?: FraudResult


}
/**
 * @Def
 * The structure form data sent by the client to create a transaction
 */
export class TransactionRequestDto {
 
    senderAccountNumber:string
    receiverAccountNumber:string;
    amount: number
    type: string
    merchantCategory: string
    location: string
    currency: string
    description: string
    receiverContact?: string
    receiverEmail: string
    device: string
    ipAddress: string
}
/**
 * @Def
 * The transaction result that receives the user when creates a transaction 
 */
export class TransactionResponseDto {
    transactionId:string;
    status:string;
    message:string;
}
export class UpdateTransactionDto extends PartialType(TransactionRequestDto) {}