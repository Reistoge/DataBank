import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { Model } from 'mongoose';
import { CardService } from 'src/card/card.service';
import {
  CreateAccountDto,
  AccountResponseDto,
  UpdateAccountDto,
  AccountType,
  AccountState,
  AccountAdminResponse,
} from './dto/account.dto';
import { UserService } from 'src/users/users.service';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
import {
  CreateAccountNode,
  CypherQuery,
} from 'src/fraud-system/queries/cypher-query';

@Injectable()
export class AccountService {
  async getAccountDocumentFromCardNumber(
    cardNumber: string,
  ): Promise<AccountDocument> {
    this.logger.log(`Searching for account by card number ${cardNumber}`);
    try {
      const card = await this.cardService.getCardByCardNumber(cardNumber);
      const account = await this.accountModel
        .findOne({ _id: card.accountId, state: AccountState.DEFAULT })
        .exec();
      if (!account) {
        throw new NotFoundException(
          `Account not found or not in default state`,
        );
      }
      this.logger.log(`Account found for card ${cardNumber}`);
      return account;
    } catch (err) {
      this.logger.error(
        `Error finding account by card number ${cardNumber}`,
        err,
      );
      throw err instanceof Error
        ? err
        : new Error('Error getting account from card number');
    }
  }
  v;
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private cardService: CardService,
    private neo4jService: Neo4jService,
  ) {}

  async create(
    createAccountDto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    if (!createAccountDto.userId)
      throw new BadRequestException('userId is required to create an account');

    const accountNumber = await this.generateUniqueAccountNumber();
    const balance = 0;
    const type = createAccountDto.type ?? AccountType.SAVINGS;
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

    try {
      this.logger.log('creating account Node');
      const q: CypherQuery<AccountDocument> = new CreateAccountNode(
        this.neo4jService,
        savedAccount,
      );
      q.execute();
    } catch (err) {
      this.logger.error('Error creating node account', err);
      throw err instanceof Error
        ? err
        : new Error('Error creating node account');
    }

    return {
      ...newAccount,
      id: savedAccount._id.toString(),
      bankBranch: savedAccount.bankBranch,
    };
  }

  async settleTransaction(
    senderId: string,
    receiverId: string,
    amount: number,
  ) {
    this.logger.log(`Updating users balance`);
    if (amount <= 0) {
      throw new UnprocessableEntityException(
        'Amount must be greater than zero',
      );
    }

    const session = await this.accountModel.db.startSession();
    let result: { sender?: any; receiver?: any } | undefined;

    try {
      await session.withTransaction(
        async () => {
          // Atomically debit sender only if they have enough balance
          const sender = await this.accountModel
            .findOneAndUpdate(
              { _id: senderId, balance: { $gte: amount } },
              { $inc: { balance: -amount } },
              { new: true, session },
            )
            .exec();

          if (!sender) {
            // either sender not found or insufficient funds
            throw new UnprocessableEntityException(
              'Sender not found or insufficient funds',
            );
          }

          // Credit receiver
          const receiver = await this.accountModel
            .findByIdAndUpdate(
              receiverId,
              { $inc: { balance: amount } },
              { new: true, session },
            )
            .exec();

          if (!receiver) {
            // If receiver missing, throw to abort transaction and rollback sender debit
            throw new NotFoundException('Receiver not found');
          }

          result = { sender, receiver };
        },
        {
          // Optional: transaction options (read/write concern) can go here
        },
      );

      return result;
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Error settling transaction');
    } finally {
      session.endSession();
    }
  }
  async getAccountBalanceByAccountNumber(
    accountNumber: string,
  ): Promise<number> {
    const account = await this.getAccountDocumentByAccountNumber(accountNumber);
    return account.balance;
  }

  async getAccountDocumentByAccountNumber(
    accountNumber: string,
  ): Promise<AccountDocument> {
    this.logger.log(`Searching for account ${accountNumber}`);
    const account = await this.accountModel.findOne({ accountNumber }).exec();
    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }
    this.logger.log(`Account ${accountNumber} found`);
    return account;
  }
  async checkAccountExistance(accountNumber: string): Promise<boolean> {
    try {
      await this.getAccountDocumentByAccountNumber(accountNumber);
      return true;
    } catch (err) {
      if (err instanceof NotFoundException) {
        return false;
      }
      throw err;
    }
  }

  async isAccountValid(accountNumber: string): Promise<boolean> {
    try {
      const account =
        await this.getAccountDocumentByAccountNumber(accountNumber);
      return account.state === AccountState.DEFAULT;
    } catch (err) {
      this.logger.warn(`account with accountNumber ${accountNumber} not valid`);
      return false;
    }
  }

  async getUserByAccountNumber(accountNumber: string): Promise<User> {
    this.logger.log(`Searching user with account ${accountNumber}`);
    try {
      const account =
        await this.getAccountDocumentByAccountNumber(accountNumber);
      const user = await this.userService.getUserDocumentById(account.userId);
      return user;
    } catch (err) {
      this.logger.error(`Error finding user by account ${accountNumber}`, err);
      throw err instanceof Error ? err : new Error('Error getting user');
    }
  }

  async getUserDocumentByAccountNumber(
    accountNumber: string,
  ): Promise<UserDocument> {
    this.logger.log(`Searching user with account ${accountNumber}`);
    try {
      const account =
        await this.getAccountDocumentByAccountNumber(accountNumber);
      const user = await this.userService.getUserDocumentById(account.userId);
      return user;
    } catch (err) {
      this.logger.error(`Error finding user by account ${accountNumber}`, err);
      throw err instanceof Error ? err : new Error('Error getting user');
    }
  }

  async findAccountsByUserId(userId: string): Promise<AccountResponseDto[]> {
    this.logger.log(`Fetching accounts for user ${userId}`);
    const accountDocs = await this.accountModel
      .find({ userId, state: AccountState.DEFAULT })
      .exec();
    return accountDocs.map((account) => ({
      id: account._id?.toString(),
      userId: account.userId,
      accountNumber: account.accountNumber,
      balance: account.balance,
      type: account.type,
      isActive: account.isActive,
      bankBranch: account.bankBranch,
    }));
  }
  as;
  d;
  async update(
    updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    const updatedAccount = await this.accountModel
      .findOneAndUpdate(
        { _id: updateAccountDto.id },
        updateAccountDto,
        { new: true }, // Return the updated document, not the original
      )
      .lean<AccountDocument>()
      .exec();

    if (!updatedAccount) {
      throw new NotFoundException(
        `Account with id ${updateAccountDto.id} not found`,
      );
    }

    // Convert AccountDocument to AccountResponseDto
    return {
      id: updatedAccount._id.toString(),
      userId: updatedAccount.userId,
      accountNumber: updatedAccount.accountNumber,
      balance: updatedAccount.balance,
      type: updatedAccount.type,
      isActive: updatedAccount.isActive,
      bankBranch: updatedAccount.bankBranch,
    };
  }

  async deleteAccount(accountId: string) {
    this.logger.log(`Soft-deleting account ${accountId}`);
    try {
      await this.accountModel
        .updateOne({ _id: accountId }, { state: AccountState.DELETED })
        .exec();
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
      accountNumber = Math.floor(
        1000000000 + Math.random() * 9000000000,
      ).toString();
      exists = await this.accountModel.exists({ accountNumber });
    } while (exists);
    return accountNumber;
  }
  toResponseDto(a: AccountDocument): AccountResponseDto {
    return {
      id: a._id?.toString(),
      userId: a.userId,
      accountNumber: a.accountNumber,
      balance: a.balance,
      type: a.type,
      isActive: a.isActive,
      bankBranch: a.bankBranch,
    };
  }

  async findAllAdminResponse(): Promise<AccountAdminResponse[]> {
    try {
      const accounts: AccountDocument[] =
        (await this.accountModel.find({}).lean<AccountDocument[]>().exec()) ??
        [];
      return accounts.map((a: AccountDocument) => {
        const createdAt = a.createdAt ?? 'No date';
        const responseDto = this.toResponseDto(a);
        return {
          ...responseDto,
          state: a.state,
          createdAt: a.createdAt?.toISOString() ?? 'No date',
        };
      });
    } catch (err) {
      this.logger.error('Error fetching admin accounts', err);
      throw err instanceof Error
        ? err
        : new Error('Error parsing accounts data');
    }
  }

  async findAccountsByUserIdAndType(
    userId: string,
    accountType: AccountType,
  ): Promise<AccountResponseDto[]> {
    try {
      return await this.accountModel
        .find({ userId, type: accountType })
        .lean<AccountResponseDto[]>()
        .exec();
    } catch (error) {
      this.logger.error(`Error finding accounts by type: ${error}`);
      return [];
    }
  }
}
