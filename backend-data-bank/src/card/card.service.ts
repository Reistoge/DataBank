import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CardResponse, CreateCardDto, UserCardReqDto } from './dto/card.dto';
import { UserUpdateCardReqDto } from './dto/card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Card, CardDocument } from './entities/card.schema';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
@Injectable()
export class CardService {

  private readonly logger = new Logger(CardService.name);
  constructor(@InjectModel(Card.name) private readonly cardModel: Model<CardDocument>) { }

  async create(createCardDto: CreateCardDto): Promise<CardResponse> {
    const cvv =  Math.floor(100 + Math.random() * 900)
    const cardNumber = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('') ;
    // built the new card
    this.logger.log(`creating new card with properties: ${JSON.stringify(createCardDto)}`);

    const newCard = {
      ...createCardDto,
      cvv:cvv, // random 3-digit number
      number:cardNumber // random 16-digit number as string
    };

    this.logger.log(`New card generated: ${JSON.stringify(newCard)}`);

    const createdCard = await new this.cardModel(newCard).save();

    this.logger.log(` saved card ${JSON.stringify(createdCard.toObject())}`);

    // Print all properties of the created card
    this.logger.log(`Created card properties: ${JSON.stringify(createdCard.toObject())}`);
 
    return {
      id: createdCard._id?.toString(),
      cvv: createdCard.cvv,
      number: createdCard.number,
      penalties: 0,
      spentLimit: Number.MAX_SAFE_INTEGER,
    }


  }

  async getUserCards(user: UserCardReqDto): Promise<CardResponse[]> {

    const cardDocs = await this.cardModel.find({ userId: user.id }).exec();
    return cardDocs.map(card => ({
      id: card._id?.toString(),
      cvv: card.cvv,
      number: card.number,
      penalties: card.penalties ?? 0,
      spentLimit: card.spentLimit ?? Number.MAX_SAFE_INTEGER,
    }));

  }


  async update(accessPassword: string, updateCardDto: UserUpdateCardReqDto) {

    const card = await this.cardModel.findById(updateCardDto.id).exec()
    this.logger.log(`check accessPassword: ${accessPassword} for card with id ${updateCardDto.id}`)

    if (card === null) {
      this.logger.warn(`card not found`);
      throw new ConflictException(`Problem finding user card`)
    }
    if (card?.password !== accessPassword) {
      this.logger.warn(`invalid password`);
      throw new ConflictException(`Invalid password`);
    } else {

      Object.assign(card, updateCardDto);
      await card.save();

    }


  }

  remove(id: string) {
    return this.cardModel.findByIdAndDelete(id).exec();
  }
}
