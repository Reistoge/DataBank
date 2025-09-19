import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CardDocument = Card & Document;

@Schema({ timestamps: true })
export class Card extends Document{

    // _id: Types.ObjectId;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    cvv: number

    @Prop({ required: true, unique: true })
    number: string

    @Prop({ default: 0 })
    penalties: number;
    
    @Prop({ default: Number.MAX_VALUE})
    spentLimit: number;

}
export const CardSchema = SchemaFactory.createForClass(Card);