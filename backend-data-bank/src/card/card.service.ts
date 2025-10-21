import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CardResponse, CardState, CreateCardDto, UserUpdateCardReqDto } from './dto/card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Card, CardDocument } from './schemas/card.schema';
import { Model } from 'mongoose';
import { AccountState } from 'src/account/dto/account.dto';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);
  constructor(@InjectModel(Card.name) private readonly cardModel: Model<CardDocument>) { }

  async create(createCardDto: CreateCardDto): Promise<CardResponse> {
    const cvv = await this.generateUniqueCvvNumber();
    const cardNumber = await this.generateUniqueCardNumber();

    const newCard = {
      ...createCardDto,
      cvv,
      number: cardNumber,

    };

    const createdCard = await new this.cardModel(newCard).save();

    return {
      id: createdCard._id?.toString(),
      cvv: createdCard.cvv,
      number: createdCard.number,
      penalties: createdCard.penalties ?? 0,
      spentLimit: createdCard.spentLimit ?? Number.MAX_SAFE_INTEGER,
    };
  }

  async getAccountCards(accountId: string): Promise<CardResponse[]> {
    const cardDocs = await this.cardModel.find({ accountId, state: CardState.DEFAULT }).exec();
    return cardDocs.map(card => ({
      id: card._id?.toString(),
      cvv: card.cvv,
      number: card.number,
      penalties: card.penalties ?? 0,
      spentLimit: card.spentLimit ?? Number.MAX_SAFE_INTEGER,
    }));
  }

  private async generateUniqueCardNumber(): Promise<string> {
    let number: string;
    let exists: { _id: any } | null;
    do {
      number = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
      exists = await this.cardModel.exists({ number });
    } while (exists);
    return number;
  }

  private async generateUniqueCvvNumber(): Promise<string> {
    let cvv: string;
    let exists: { _id: any } | null;
    do {
      cvv = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
      exists = await this.cardModel.exists({ cvv });
    } while (exists);
    return cvv;
  }


  async update(accessPassword: string, updateCardDto: UserUpdateCardReqDto) {
    this.logger.log(`updateCardDto: ${(Object.entries(updateCardDto).map(([key, value]) => (`${String(key)}: ${String(value)} \n`)))} accesPasword: ${accessPassword}`);
    const card = await this.cardModel.findById(updateCardDto.id).exec();
    this.logger.log(`Card find ${card}`);
    if (!card) throw new ConflictException(`Problem finding user card`);
    if (card.password !== accessPassword) throw new ConflictException(`Invalid password`);
    Object.assign(card, updateCardDto);
    this.logger.log(`Card updated succesfully ${card}`);
    await card.save();
  }

  deleteCardsForAccount(accountId: string) {
    return this.cardModel.updateMany({ accountId }, { state: AccountState.DELETED }).exec();
    //return this.cardModel.deleteMany({ accountId }).exec();
  }

  private remove(id: string) {
    return this.cardModel.findByIdAndDelete(id).exec();
  }
  async removeCard(id: string, password: string) {
    this.logger.log(`try to remove card with id: ${id} and pass: ${password}`)
    // verify password
    try {
      const card = await this.cardModel.findById(id).exec();
      if (!card) throw new NotFoundException('Card not found');
      if (card.password !== password) throw new ConflictException('Invalid password');

      return this.cardModel.updateOne({ _id: id }, { state: CardState.DELETED }).exec();
    } catch (err) {
      this.logger.error(`Error removing card: ${err?.message || err}`);
      throw err;
    }

  }

}