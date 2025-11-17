import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AccountState, AccountType } from '../dto/account.dto';
export type AccountDocument = Account & Document;
@Schema({ timestamps: true })
export class Account {
  _id: Types.ObjectId;

  @Prop({ required: true })
  userId: string; // referencia al User

  @Prop({ required: true })
  userNumber: string;

  @Prop({ required: true, unique: true })
  accountNumber: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ required: true, enum: AccountType })
  type: AccountType; // tipo de cuenta

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  bankBranch: string;

  @Prop({ default: AccountState.DEFAULT, enum: AccountState })
  state: AccountState;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
