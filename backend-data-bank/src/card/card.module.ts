import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Card, CardSchema } from './schemas/card.schema';
import { DatabaseModule } from 'src/database/database.module';
 
@Module({
  imports: [MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]), DatabaseModule],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule { }
