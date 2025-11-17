import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/users/users.service';
import { AccountService } from 'src/account/account.service';
import { MerchantService } from 'src/users/merchant/merchant.service';
import { UserRole } from 'src/users/schemas/user.schema';
import { AccountType } from 'src/account/dto/account.dto';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from 'src/payment/entities/product.schema';
import { Merchant, MerchantDocument } from 'src/payment/entities/merchant.schema';
import { CardService } from 'src/card/card.service';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);
  private data: any;

  constructor(
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly merchantService: MerchantService,
    private readonly cardService: CardService,
    private readonly configService: ConfigService,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Merchant.name) private readonly merchantModel: Model<MerchantDocument>,
  ) {
    this.loadData();
  }

  private loadData() {
    try {
      const filePath = path.join(process.cwd(), 'src/database/seeds/seed-data.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      this.data = JSON.parse(fileContent);
    } catch (error) {
      this.logger.error('Failed to load seed-data.json', error);
      this.data = { users: [], systemMerchants: [], products: [] };
    }
  }

  async onModuleInit() {
    if (this.configService.get('NODE_ENV') === 'dev') {
      this.logger.log('🌱 Starting database seeding...');
      await this.seedDatabase();
    }
  }

  async seedDatabase() {
    try {
      const seededUsers = await this.seedUsers();
      await this.seedMerchants(seededUsers);
      await this.seedProducts();
      this.logger.log('✅ Database seeding completed successfully');
    } catch (error) {
      this.logger.error('❌ Database seeding failed:', error);
    }
  }

  private async seedUsers() {
    this.logger.log('👥 Seeding users...');
    const createdUsers: any[] = [];

    for (const rawUser of this.data.users) {
      try {
        const userData = {
          ...rawUser,
          birthday: new Date(rawUser.birthday),
          password: await bcrypt.hash(rawUser.password, 10),
        };

        const existingUser = await this.userService.getUserByEmail(userData.email);

        if (existingUser) {
          this.logger.log(`User ${userData.email} already exists, skipping...`);
          const userDoc = await this.userService.getUserDocumentByRut(userData.rut);
          if (userDoc) {
            createdUsers.push({
              user: existingUser,
              userDoc,
              userData: userData,
              accounts: await this.accountService.findAccountsByUserId(existingUser.id),
            });
          }
          continue;
        }

        const user = await this.userService.create({
          rut: userData.rut,
          username: userData.username,
          email: userData.email,
          password: userData.password,
          birthday: userData.birthday,
          country: userData.country,
          region: userData.region,
        });

        if (userData.roles?.includes(UserRole.ADMIN)) {
          const userDoc = await this.userService.getUserDocumentByRut(userData.rut);
          if (userDoc) {
            userDoc.roles = userData.roles;
            await this.userService.updateUserById(userDoc.id, userDoc);
          }
        }

        this.logger.log(`✅ Created user: ${user.email}`);

        const accounts = await this.seedAccountsForUser(user.id, user.username, userData.accountTypes);
        const userDoc = await this.userService.getUserDocumentById(user.id);

        createdUsers.push({
          user,
          userDoc,
          userData,
          accounts,
        });
      } catch (error) {
        this.logger.error(`Failed to create user ${rawUser.email}:`, error);
      }
    }

    return createdUsers;
  }

  private async seedAccountsForUser(
    userId: string,
    username: string,
    accountTypes: AccountType[]
  ) {
    try {
      const userDoc = await this.userService.getUserDocumentById(userId);
      const createdAccounts: any[] = [];

      for (const accountType of accountTypes) {
        try {
          const existingAccount = await this.accountService.findAccountsByUserIdAndType(
            userId,
            accountType
          );
          if (existingAccount && existingAccount.length > 0) {
            this.logger.log(
              `Account type ${accountType} already exists for ${username}, skipping...`
            );
            createdAccounts.push(...existingAccount);
            continue;
          }

          const accountData = {
            userId,
            userNumber: userDoc.userNumber,
            type: accountType,
            bankBranch: userDoc.region || 'Santiago',
          };

          const account = await this.accountService.create(accountData);
          this.logger.log(
            `✅ Created ${accountType} account for ${username}: ${account.accountNumber}`
          );

          if (accountType === AccountType.BUSINESS) {
            await this.seedBusinessCardsForAccount(
              account.accountNumber!,
              account.id!,
              'business-card-password'
            );
          } else {
            await this.seedCardsForAccount(
              account.accountNumber!,
              account.id!,
              'default-card-password'
            );
          }

          createdAccounts.push(account);
        } catch (error) {
          this.logger.error(`Failed to create ${accountType} account for ${username}:`, error);
        }
      }

      return createdAccounts;
    } catch (error) {
      this.logger.error(`Failed to create accounts for user ${username}:`, error);
      return [];
    }
  }

  private async seedCardsForAccount(
    accountNumber: string,
    accountId: string,
    cardPassword: string
  ) {
    try {
      const cardData = {
        accountNumber,
        accountId,
        password: cardPassword,
      };

      const card = await this.cardService.create(cardData);
      this.logger.log(`✅ Created DEBIT card: ${card.number}`);
    } catch (error) {
      this.logger.error(`Failed to create cards for account ${accountNumber}:`, error);
    }
  }

  private async seedBusinessCardsForAccount(
    accountNumber: string,
    accountId: string,
    cardPassword: string
  ) {
    try {
      const cardTypes = ['BUSINESS_DEBIT', 'BUSINESS_CREDIT'];

      const cards = [
        { accountNumber, accountId, password: cardPassword },
        { accountNumber, accountId, password: cardPassword },
      ];

      for (let i = 0; i < cards.length; i++) {
        try {
          const card = await this.cardService.create(cards[i]);
          this.logger.log(`✅ Created ${cardTypes[i]} card: ${card.number}`);
        } catch (error) {
          this.logger.error(`Failed to create business card ${cardTypes[i]}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to create business cards for account ${accountNumber}:`,
        error
      );
    }
  }

  private async seedMerchants(createdUsers: any[]) {
    this.logger.log('🏪 Seeding merchants...');

    const businessUsers = createdUsers.filter(
      (u) =>
        u.userData.merchantData &&
        u.accounts.some((acc: any) => acc.type === AccountType.BUSINESS)
    );

    for (const businessUser of businessUsers) {
      try {
        const businessAccount = businessUser.accounts.find(
          (acc: any) => acc.type === AccountType.BUSINESS
        );
        if (!businessAccount) continue;

        const merchantData = {
          ...businessUser.userData.merchantData,
          accountNumber: businessAccount.accountNumber,
          email: businessUser.userDoc.email,
        };

        const userPayload = {
          id: businessUser.userDoc._id.toString(),
          username: businessUser.userDoc.username,
          userNumber: businessUser.userDoc.userNumber,
          email: businessUser.userDoc.email,
          rut: businessUser.userDoc.rut,
          roles: businessUser.userDoc.roles,
        };

        const merchant = await this.merchantService.create(merchantData, userPayload);
        this.logger.log(`✅ Created merchant: ${merchant.name}`);
      } catch (error) {
        this.logger.error(
          `Failed to create merchant for user ${businessUser.user.email}:`,
          error
        );
      }
    }

    await this.createSystemMerchants(createdUsers);
  }

  private async createSystemMerchants(createdUsers: any[]) {
    const adminUser = createdUsers.find((u) =>
      u.userData.roles?.includes(UserRole.ADMIN)
    );
    if (!adminUser) {
      this.logger.warn('No admin user found for system merchants');
      return;
    }

    const adminBusinessAccount = adminUser.accounts.find(
      (acc: any) => acc.type === AccountType.BUSINESS
    );
    if (!adminBusinessAccount) {
      this.logger.warn('Admin user has no business account for system merchants');
      return;
    }

    const adminPayload = {
      id: adminUser.userDoc._id.toString(),
      username: adminUser.userDoc.username,
      userNumber: adminUser.userDoc.userNumber,
      email: adminUser.userDoc.email,
      rut: adminUser.userDoc.rut,
      roles: adminUser.userDoc.roles,
    };

    for (const rawMerchant of this.data.systemMerchants) {
      try {
        const merchantData = {
          ...rawMerchant,
          accountNumber: adminBusinessAccount.accountNumber,
        };

        const merchant = await this.merchantService.create(merchantData, adminPayload);
        this.logger.log(`✅ Created system merchant: ${merchant.name}`);
      } catch (error) {
        this.logger.error(`Failed to create system merchant ${rawMerchant.name}:`, error);
      }
    }
  }

  private async seedProducts() {
    this.logger.log('📦 Seeding products...');

    const merchants = await this.merchantModel.find().lean().exec();
    const merchantMap = new Map(merchants.map((m: any) => [m.name, m._id.toString()]));

    if (merchantMap.size === 0) {
      this.logger.warn('⚠️ No merchants found. Please seed merchants first before products.');
      return;
    }

    for (const productData of this.data.products) {
      try {
        const merchantId = merchantMap.get(productData.merchantName);

        if (!merchantId) {
          this.logger.warn(
            `⚠️ Merchant '${productData.merchantName}' not found for product '${productData.name}'. Skipping...`
          );
          continue;
        }

        const existing = await this.productModel.findOne({ sku: productData.sku }).exec();
        if (existing) {
          this.logger.log(`✓ Product already exists: ${productData.name}, skipping...`);
          continue;
        }

        const product = await this.productModel.create({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          quantity: productData.quantity,
          sku: productData.sku,
          category: productData.category,
          isActive: productData.isActive,
          merchantId,
        });

        this.logger.log(
          `✅ Created product: ${product.name} (Merchant: ${productData.merchantName}, ID: ${merchantId})`
        );
      } catch (error) {
        this.logger.error(`Failed to create product ${productData.name}:`, error);
      }
    }
  }
}