import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { timeStamp } from 'node:console';

export type UserDocument = User & Document;
export enum UserRole {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
  EXEC = 'EXEC',
}
export class Contact{
  accountNumber : string;
  name: string;
  email:string;
  type: string;
  category: string;

}
@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  userNumber: string;

  @Prop({ required: true })
  password: string; // almacenada con bcrypt

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  rut: string;

  @Prop({ default: null })
  refreshToken: string;

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.CLIENT],
  })
  roles: UserRole[];

  @Prop({ type: Date })
  birthday?: Date;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  region: string;

  @Prop({ type: Date, default: null })
  lastLogin?: Date | null;

  @Prop({ type: [Object], default: [] })
  contacts: Contact[];
 
}

export const UserSchema = SchemaFactory.createForClass(User);
