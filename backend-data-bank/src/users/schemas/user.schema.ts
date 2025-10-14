import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { timeStamp } from 'node:console';
  
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string; // almacenada con bcrypt

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  rut: string; // identificación nacional

  @Prop({ default: null })
  refreshToken: string;

  @Prop({ type: [String], enum: ['CLIENT', 'ADMIN', 'EXEC'], default: ['CLIENT'] })
  roles: string[];

  @Prop({ type: Date })
  birthday?: Date;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  region: string;

  @Prop({ type: Date, default: null })
  lastLogin?: Date | null;
 
}


export const UserSchema = SchemaFactory.createForClass(User);