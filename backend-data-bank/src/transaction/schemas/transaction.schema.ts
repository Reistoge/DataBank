import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PredictionOutput } from 'src/fraud-system/dto/prediction.dto';
import { TransactionSnapshot } from '../dto/transaction.dto';
import { InvalidDetails } from '../transaction.service';
 


export type TransactionDocument = Transaction & Document;
export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Transaction extends Document {

    @Prop({ required: true })
    senderId: string;

    @Prop({ required: true })
    receiverId: string

    @Prop({ required: true, type: Object })
    snapshot: TransactionSnapshot

    @Prop({ required: true, enum: TransactionStatus, default: TransactionStatus.PENDING })
    status: TransactionStatus

    
    @Prop({type:Object})
    invalidDetails?:InvalidDetails


}



export const TransactionSchema = SchemaFactory.createForClass(Transaction);