import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { Model } from 'mongoose';
import { CardService } from 'src/card/card.service';
import { CreateAccountDto, AccountResponseDto, UpdateAccountDto, AccountType, AccountState } from './dto/account.dto';
import { UsersService } from 'src/users/users.service';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
import { CypherQuery } from 'src/fraud-system/queries/cypher-query';

@Injectable()
export class AccountService {

  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
    private userService: UsersService,
    private cardService: CardService,
    //private neo4jService: Neo4jService
  ) { }

  async create(createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    if (!createAccountDto.userId) throw new Error('userId is required to create an account');

    const accountNumber = await this.generateUniqueAccountNumber();
    const balance = 0;
    const type = createAccountDto.type ?? AccountType.CHECKING;
    const isActive = true;
    const newAccount = {
      userId: createAccountDto.userId,
      userNumber: createAccountDto.userNumber,
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
  async settleTransaction(senderId: string, receiverId: string, amount: number) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const session = await this.accountModel.db.startSession();
    let result: { sender?: any; receiver?: any } | undefined;

    try {
      await session.withTransaction(async () => {
        // Atomically debit sender only if they have enough balance
        const sender = await this.accountModel.findOneAndUpdate(
          { _id: senderId, balance: { $gte: amount } },
          { $inc: { balance: -amount } },
          { new: true, session }
        ).exec();

        if (!sender) {
          // either sender not found or insufficient funds
          throw new Error('Sender not found or insufficient funds');
        }

        // Credit receiver
        const receiver = await this.accountModel.findByIdAndUpdate(
          receiverId,
          { $inc: { balance: amount } },
          { new: true, session }
        ).exec();

        if (!receiver) {
          // If receiver missing, throw to abort transaction and rollback sender debit
          throw new Error('Receiver not found');
        }

        result = { sender, receiver };
      }, {
        // Optional: transaction options (read/write concern) can go here
      });

      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error settling transaction');
    } finally {
      session.endSession();
    }
  }
  async getAccountBalanceByAccountNumber(accountNumber: string): Promise<number> {
    const account = await this.getAccountDocumentByAccountNumber(accountNumber);
    return account.balance;
  }

  async getAccountDocumentByAccountNumber(accountNumber: string): Promise<AccountDocument> {
    this.logger.log(`Searching for account ${accountNumber}`);
    const account = await this.accountModel.findOne({ accountNumber }).exec();
    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }
    this.logger.log(`Account ${accountNumber} found`);
    return account;
  }


  async isAccountValid(accountNumber: string): Promise<boolean> {
    try {
      const account = await this.getAccountDocumentByAccountNumber(accountNumber);
      return account.state === AccountState.DEFAULT;
    } catch (err) {
      this.logger.warn(`account with accountNumber ${accountNumber} not valid`);
      return false;
    }
  }

  async getUserByAccountNumber(accountNumber: string): Promise<User> {
    this.logger.log(`Searching user with account ${accountNumber}`);
    try {
      const account = await this.getAccountDocumentByAccountNumber(accountNumber);
      const user = await this.userService.getUserDocumentById(account.userId);
      return user;
    } catch (err) {
      this.logger.error(`Error finding user by account ${accountNumber}`, err);
      throw err instanceof Error ? err : new Error('Error getting user');
    }
  }

  async getUserDocumentByAccountNumber(accountNumber: string): Promise<UserDocument> {
    this.logger.log(`Searching user with account ${accountNumber}`);
    try {
      const account = await this.getAccountDocumentByAccountNumber(accountNumber);
      const user = await this.userService.getUserDocumentById(account.userId);
      return user;
    } catch (err) {
      this.logger.error(`Error finding user by account ${accountNumber}`, err);
      throw err instanceof Error ? err : new Error('Error getting user');
    }
  }

  async findAccountsByUserId(userId: string): Promise<AccountResponseDto[]> {
    this.logger.log(`Fetching accounts for user ${userId}`);
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

  async deleteAccount(accountId: string) {
    this.logger.log(`Soft-deleting account ${accountId}`);
    try {
      await this.accountModel.updateOne({ _id: accountId }, { state: AccountState.DELETED }).exec();
      await this.cardService.deleteCardsForAccount(accountId);
    } catch (err) {
      this.logger.error(`Error deleting account ${accountId}`, err);
      throw err;
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