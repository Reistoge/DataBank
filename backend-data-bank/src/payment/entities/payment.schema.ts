import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Product } from './product.schema';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
    @Prop({ required: true })
    merchantId: string
    
    @Prop({ required: true })
    product: Product;
    
    @Prop({ required: true })
    orderNumber: string;

    @Prop({required:true})
    txId: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);