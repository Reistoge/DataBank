import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { Model } from 'mongoose';
import { CardService } from 'src/card/card.service';
import { CreateAccountDto, AccountResponseDto, UpdateAccountDto, AccountReqDto, AccountType } from './dto/account.dto';



@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
    private cardService: CardService) { }

  async create(createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    this.logger.log(`Creating new Account for ${JSON.stringify(createAccountDto)}`);

    if (!createAccountDto.id) {
      throw new Error('userId is required to create an account');
    }

    let accountNumber: string = await this.generateUniqueAccountNumber();
    let balance: number = 0;
    let type: AccountType = createAccountDto.type? createAccountDto.type as AccountType : AccountType.CHECKING;
    let isActive: boolean = true;

    const newAccount = {
      userId: createAccountDto.id, // Now guaranteed to be string
      accountNumber,
      balance,
      type,
      isActive,
    };

    let savedAccount = await new this.accountModel(newAccount).save();

    this.logger.log(` new account created succesfully  for ${JSON.stringify(savedAccount)}`);

    const accountResponse: AccountResponseDto = {
      ...newAccount,
      id: savedAccount.id,
    };

    this.logger.log(` returning response  for ${JSON.stringify(accountResponse)}`);

    return accountResponse;
  }



  findAll() {
    return `This action returns all account`;
  }

  async getUserAccounts(user: AccountReqDto): Promise<AccountResponseDto[]> {

    const accountDocs = await this.accountModel.find({ userId: user.id }).exec();
    return accountDocs.map(account => ({
      id: account._id?.toString(),
      userId: account.userId,
      accountNumber: account.accountNumber,
      balance: account.balance,
      type: account.type,
      isActive: account.isActive,
    }));

  }

  update(updateAccountDto: UpdateAccountDto) {
    this.accountModel.findOneAndUpdate({ _id: updateAccountDto.id }, updateAccountDto);

  }
  remove(account: AccountReqDto) {
    this.accountModel.findOneAndDelete({ _id: account.id });
    if (account.id) {
      this.cardService.deleteCardsForAccount(account.id);

    }
    else {
      this.logger.error('Account id is missing when deleting cards');

    }

  }

/**
 * @explain generates random numbers and check if that account number exist, if not it return that number.
 * @returns @string the unique account number
 */
  private async generateUniqueAccountNumber(): Promise<string> {
    this.logger.log(`Generating new account number`);
    let accountNumber: string;
    let exists: { id: any } | { _id: any } | null;
    do {
      accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10-digit number
      exists = await this.accountModel.exists({ accountNumber });
    } while (exists);
    this.logger.log(`new account number generated succesfully`);
    return accountNumber;
  }
}
