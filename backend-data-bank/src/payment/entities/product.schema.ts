import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type ProductDocument = Product & Document
@Schema({ timestamps: true })
export class Product extends Document {

    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop({ default: 0 })
    quantity: number;

    @Prop()
    sku: string;

    @Prop()
    category: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({required:true})
    merchantId:string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);