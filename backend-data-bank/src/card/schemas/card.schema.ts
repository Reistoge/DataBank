import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CardState } from '../dto/card.dto';

export type CardDocument = Card & Document;

@Schema({ timestamps: true })
export class Card extends Document {


    @Prop({ required: true })
    accountId: string; // referencia a la cuenta

    @Prop({ required: true })
    password: string; // PIN de la tarjeta

    @Prop({ required: true })
    cvv: number;

    @Prop({ required: true, unique: true })
    number: string; // número de tarjeta

    @Prop({ default: 'DEBIT' })
    type: string; // para futuro: crédito/débito

    @Prop({ default: 0 })
    penalties: number;

    @Prop({ default: Number.MAX_VALUE })
    spentLimit: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: CardState.DEFAULT, enum: CardState })
    state: CardState;
}

export const CardSchema = SchemaFactory.createForClass(Card);