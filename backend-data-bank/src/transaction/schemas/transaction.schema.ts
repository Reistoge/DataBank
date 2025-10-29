import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PredictionOutput } from 'src/fraud-system/dto/prediction.dto';
import { TransactionSnapshot } from '../dto/transaction.dto';


export type TransactionDocument = Transaction & Document;
export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Transaction extends Document {

    @Prop({ required: true })
    senderId: string; // Gender, Age, State, City, Bank_Branch, Account_Type, contact, city, state

    @Prop({ required: true })
    receiverId: string // merchantId

    @Prop({required:true})
    snapshot: TransactionSnapshot
    
    @Prop({ required: true, enum: TransactionStatus, default: pending })
    status: TransactionStatus



 









}



export const TransactionSchema = SchemaFactory.createForClass(Transaction);