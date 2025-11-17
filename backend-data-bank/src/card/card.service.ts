import { ConflictException, forwardRef, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { CardResponse, CardState, CreateCardDto, UserUpdateCardReqDto } from './dto/card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Card, CardDocument } from './schemas/card.schema';
import { Model } from 'mongoose';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
import { CreateCardNode, CypherQuery } from 'src/fraud-system/queries/cypher-query';
import { AuthUserPayloadDto } from 'src/auth/auth.service';
import { AccountService } from 'src/account/account.service';
import { AccountDocument } from 'src/account/schemas/account.schema';
import { UserDocument } from 'src/users/schemas/user.schema';
export class CardValidationCredential {
  cardNumber: string;
  cvv: number;
  expiryDate: string;
  password: string;
  user: AuthUserPayloadDto;
}
@Injectable()
export class CardService {
  async getCardByCardNumber(cardNumber: string): Promise<CardDocument> {
    try {
      const doc = await this.cardModel.findOne({ number: cardNumber }).lean<CardDocument>().exec();
      if (!doc) {
        throw new NotFoundException(`Card with number ${cardNumber} not found`);

      }
      this.logger.log(`card document found for ${cardNumber} returning document`);
      return doc;

    } catch (err) {
      this.logger.warn(`error finding card document `);
      throw err instanceof Error ? err : new Error(`Error while getting card by his number property`);

    }
  }
  async validateCard(cardValidationCredential : CardValidationCredential): Promise<{ cardDoc: CardDocument, accountDoc: AccountDocument, userDoc: UserDocument }> {
    try {
      const accountDoc: AccountDocument = await this.accountService.getAccountDocumentFromCardNumber(cardValidationCredential.cardNumber);
      const userDoc: UserDocument = await this.accountService.getUserDocumentByAccountNumber(accountDoc.accountNumber);
      if (userDoc.userNumber !== cardValidationCredential.user.userNumber) {
        throw new UnauthorizedException(`card number ${cardValidationCredential.cardNumber} corresponds to another user to user ${cardValidationCredential.user}`);
        // query invalid operation.

      }
      
      const card = await this.cardModel.findOne({
        number: cardValidationCredential.cardNumber,
        // expiry date
        state: CardState.DEFAULT
      }).lean<CardDocument>().exec();
      if (!card) {
        throw new NotFoundException('Card not found or is inactive');
      }
      
      if (!this.validCardEntries(card, { 
        cvv: cardValidationCredential.cvv, 
        password: cardValidationCredential.password,
        accountNumber: accountDoc.accountNumber,
      })) {
        throw new UnauthorizedException('Invalid card credentials');
      }
      return { cardDoc: card, accountDoc: accountDoc, userDoc: userDoc };

    } catch (err) {
      throw err instanceof Error ? err : new Error(`Error in validation card process for card number: ${cardValidationCredential.cardNumber} and user ${cardValidationCredential.user} `)
    }

  }
  private readonly logger = new Logger(CardService.name);

  constructor(
    @InjectModel(Card.name) private readonly cardModel: Model<CardDocument>,
    @Inject(forwardRef(()=>AccountService))
    private accountService: AccountService,
    private neo4jService: Neo4jService
  ) { }
  validCardEntries(cardDoc: CardDocument, doc: Partial<CardDocument>): boolean {
    return Object.entries(doc).every(([key, value]) => cardDoc[key] === value);
  }
  async create(createCardDto: CreateCardDto): Promise<CardResponse> {
    const cvv = await this.generateUniqueCvv();
    const cardNumber = await this.generateUniqueCardNumber();

    const newCard = {
      ...createCardDto,
      cvv,
      number: cardNumber,
    };

    const createdCard = await new this.cardModel(newCard).save();

    try {
      this.logger.log(`Creating card node`);
      const q: CypherQuery<CardDocument> = new CreateCardNode(this.neo4jService, createdCard);
      q.execute();

    } catch (err) {
      this.logger.log(`Error while creating card node err ${err}`);

    }
    return {
      id: createdCard._id?.toString(),
      cvv: createdCard.cvv,
      number: createdCard.number,
      penalties: createdCard.penalties ?? 0,
      spentLimit: createdCard.spentLimit ?? Number.MAX_SAFE_INTEGER,
    };
  }


  async findCardsByAccountId(accountId: string): Promise<CardResponse[]> {
    const cardDocs = await this.cardModel.find({ accountId, state: CardState.DEFAULT }).exec();
    return cardDocs.map(card => ({
      id: card._id?.toString(),
      cvv: card.cvv,
      number: card.number,
      penalties: card.penalties ?? 0,
      spentLimit: card.spentLimit ?? Number.MAX_SAFE_INTEGER,
    }));
  }
  async findCardsDocumentByAccountId(accountId: string): Promise<CardDocument[]> {
    const cardDocs = await this.cardModel.find({ accountId }).exec();
    return cardDocs;
  }



  async updateCard(accessPassword: string, updateCardDto: UserUpdateCardReqDto): Promise<void> {
    this.logger.log(`Updating card ${updateCardDto.id}`);

    const card = await this.cardModel.findById(updateCardDto.id).exec();
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.password !== accessPassword) {
      throw new ConflictException('Invalid password');
    }

    Object.assign(card, updateCardDto);
    await card.save();
    this.logger.log(`Card ${updateCardDto.id} updated successfully`);
  }

  async deleteCard(cardId: string, password: string): Promise<void> {
    this.logger.log(`Deleting card ${cardId}`);

    const card = await this.cardModel.findById(cardId).exec();
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.password !== password) {
      throw new ConflictException('Invalid password');
    }

    await this.cardModel.updateOne({ _id: cardId }, { state: CardState.DELETED }).exec();
    this.logger.log(`Card ${cardId} deleted successfully`);
  }

  async deleteCardsForAccount(accountId: string): Promise<void> {
    this.logger.log(`Deleting cards for account ${accountId}`);
    await this.cardModel.updateMany({ accountId }, { state: CardState.DELETED }).exec();
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

  private async generateUniqueCvv(): Promise<string> {
    let cvv: string;
    let exists: { _id: any } | null;
    do {
      cvv = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
      exists = await this.cardModel.exists({ cvv });
    } while (exists);
    return cvv;
  }
}