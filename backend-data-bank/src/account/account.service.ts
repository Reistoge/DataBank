import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { Model } from 'mongoose';
import { CardService } from 'src/card/card.service';
import { CreateAccountDto, AccountResponseDto, UpdateAccountDto, AccountType, AccountState } from './dto/account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
    private cardService: CardService
  ) { }
  private readonly logger = new Logger(AccountService.name);

  async create(createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    if (!createAccountDto.userId) throw new Error('userId is required to create an account');

    const accountNumber = await this.generateUniqueAccountNumber();
    const balance = 0;
    const type = createAccountDto.type ?? AccountType.CHECKING;
    const isActive = true;
    const newAccount  = {
      userId: createAccountDto.userId,
      accountNumber,
      balance,
      type,
      isActive,
      bankBranch: createAccountDto.bankBranch as string,
      
    } as Account;

    const savedAccount = await new this.accountModel(newAccount).save();
    
    return {
      ...newAccount,
      id: savedAccount._id.toString(),
      bankBranch: savedAccount.bankBranch,
    };
    
  }

  async getUserAccounts(userId: string): Promise<AccountResponseDto[]> {
    this.logger.log(`userAccountRequest for user ${userId}`);
    const accountDocs = await this.accountModel.find({ userId, state: AccountState.DEFAULT }).exec();
    return accountDocs.map(account => ({
      id: account._id?.toString(),
      userId: account.userId,
      accountNumber: account.accountNumber,
      balance: account.balance,
      type: account.type,
      isActive: account.isActive,
      bankBranch: account.bankBranch
    }));
  }

  async update(updateAccountDto: UpdateAccountDto) {
    await this.accountModel.findOneAndUpdate({ _id: updateAccountDto.id }, updateAccountDto).exec();
  }

  private async remove(accountId: string) {
    try {
      await this.accountModel.findOneAndDelete({ _id: accountId }).exec();
      await this.cardService.deleteCardsForAccount(accountId);
    } catch (err) {
      throw new Error(err);
    }



  }
   async removeAccount(accountId: string) {
    try {
      await this.accountModel.updateMany({ _id: accountId }, {state: AccountState.DELETED}).exec();
      await this.cardService.deleteCardsForAccount(accountId);
    } catch (err) {
      throw new Error(err);
    }



  }

  private async generateUniqueAccountNumber(): Promise<string> {
    let accountNumber: string;
    let exists: { _id: any } | null;
    do {
      accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      exists = await this.accountModel.exists({ accountNumber });
    } while (exists);
    return accountNumber;
  }
}