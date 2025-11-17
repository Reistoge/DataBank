import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type MerchantDocument = Merchant & Document
@Schema({ timestamps: true })
export class Merchant extends Document {
    @Prop({ required: true })
    accountNumber: string;

    @Prop({ required: true , unique:true})
    name: string;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    contact: string;

    @Prop({ required: true })
    email: string;



}

export const MerchantSchema = SchemaFactory.createForClass(Merchant);