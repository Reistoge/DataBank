import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CardResponse, CreateCardDto, CardReqDto } from './dto/card.dto';
import { UserUpdateCardReqDto } from './dto/card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Card, CardDocument } from './schemas/card.schema';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { AccountResponseDto } from 'src/account/dto/account.dto';
@Injectable()
export class CardService {

  private readonly logger = new Logger(CardService.name);
  constructor(@InjectModel(Card.name) private readonly cardModel: Model<CardDocument>) { }

  async create(createCardDto: CreateCardDto): Promise<CardResponse> {
    const cvv = await this.generateUniqueCvvNumber();
    const cardNumber = await this.generateUniqueCardNumber();
    // built the new card
    this.logger.log(`creating new card with properties: ${JSON.stringify(createCardDto)}`);

    const newCard = {
      ...createCardDto,
      cvv: cvv, // random 3-digit number
      number: cardNumber // random 16-digit number as string
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
  async getAccountCards(account: CardReqDto): Promise<CardResponse[]> {

    const cardDocs = await this.cardModel.find({ accountId: account.id }).exec();
    return cardDocs.map(card => ({
      id: card._id?.toString(),
      cvv: card.cvv,
      number: card.number,
      penalties: card.penalties ?? 0,
      spentLimit: card.spentLimit ?? Number.MAX_SAFE_INTEGER,
    }));

  }
  /**
 * @explain generates random numbers and check if that card number exist, if not it return that number.
 * @returns @string the unique card number
 */
  private async generateUniqueCardNumber(): Promise<string> {
    this.logger.log(`Generating new Card number`);
    let number: string;
    let exists: { id: any } | { _id: any } | null;
    do {
      number = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join(''); // 16-digit number
      exists = await this.cardModel.exists({ number });
    } while (exists);
    this.logger.log(` new Card number generated succesfully`);

    return number;
  }
  /**
* @explain generates random numbers and check if that cvv number exist, if not it return that number.
* @returns @string the unique cvv number
*/
  private async generateUniqueCvvNumber(): Promise<string> {
    this.logger.log(`Generating new Cvv number`);

    let cvv: string;
    let exists: { id: any } | { _id: any } | null;
    do {
      cvv = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join(''); // cvv-digit number
      exists = await this.cardModel.exists({ cvv });
    } while (exists);
    this.logger.log(` new Card Cvv generated succesfully`);

    return cvv;
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
  deleteCardsForAccount(accountId: string) {
    return this.cardModel.deleteMany({ accountId: accountId }).exec();
  }


  remove(id: string) {
    return this.cardModel.findByIdAndDelete(id).exec();
  }
}
