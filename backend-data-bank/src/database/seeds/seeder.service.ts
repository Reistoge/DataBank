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

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);
  private data: any;

  constructor(
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly merchantService: MerchantService,
    private readonly configService: ConfigService,
  ) {
    // Load the JSON file synchronously on instantiation
    this.loadData();
  }

  private loadData() {
    try {
      // Adjust path as needed. This assumes seed-data.json is in the same folder as this service or src/
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
        // PREPARE DATA: Convert JSON strings to Types/Hashes
        const userData = {
          ...rawUser,
          birthday: new Date(rawUser.birthday), // Convert String to Date
          password: await bcrypt.hash(rawUser.password, 10), // Hash password
        };

        const existingUser = await this.userService.getUserByEmail(userData.email);
        
        if (existingUser) {
          this.logger.log(`User ${userData.email} already exists, skipping...`);
          const userDoc = await this.userService.getUserDocumentByRut(userData.rut);
          if (userDoc) {
            createdUsers.push({
              user: existingUser,
              userDoc,
              userData, // Use processed userData
              accounts: await this.accountService.findAccountsByUserId(existingUser.id)
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
          accounts
        });

      } catch (error) {
        this.logger.error(`Failed to create user ${rawUser.email}:`, error);
      }
    }

    return createdUsers;
  }

  // ... (seedAccountsForUser, seedCardsForAccount, seedBusinessCardsForAccount remain EXACTLY the same) ...

  private async seedMerchants(createdUsers: any[]) {
    this.logger.log('🏪 Seeding merchants...');

    // 1. Create merchants attached to Business Users
    const businessUsers = createdUsers.filter(u => 
      u.userData.merchantData && 
      u.accounts.some((acc: any) => acc.type === AccountType.BUSINESS)
    );

    for (const businessUser of businessUsers) {
      try {
        const businessAccount = businessUser.accounts.find((acc: any) => acc.type === AccountType.BUSINESS);
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
          roles: businessUser.userDoc.roles
        };

        const merchant = await this.merchantService.create(merchantData, userPayload);
        this.logger.log(`✅ Created merchant: ${merchant.name}`);

      } catch (error) {
        this.logger.error(`Failed to create merchant for user ${businessUser.user.email}:`, error);
      }
    }

    // 2. Create System Merchants (Read from JSON now)
    await this.createSystemMerchants(createdUsers);
  }

  private async createSystemMerchants(createdUsers: any[]) {
    const adminUser = createdUsers.find(u => u.userData.roles?.includes(UserRole.ADMIN));
    if (!adminUser) {
      this.logger.warn('No admin user found for system merchants');
      return;
    }

    const adminBusinessAccount = adminUser.accounts.find((acc: any) => acc.type === AccountType.BUSINESS);
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
      roles: adminUser.userDoc.roles
    };

    // Loop through JSON data instead of hardcoded array
    for (const rawMerchant of this.data.systemMerchants) {
      try {
        const merchantData = {
            ...rawMerchant,
            accountNumber: adminBusinessAccount.accountNumber
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
    
    // Loop through JSON data
    for (const productData of this.data.products) {
      try {
        this.logger.log(`📦 Would create product: ${productData.name}`);
        // Implementation logic...
      } catch (error) {
        this.logger.error(`Failed to create product ${productData.name}:`, error);
      }
    }
  }

  
    
  // Missing helper methods from your original code should be pasted here 
  // (seedAccountsForUser, seedCardsForAccount, etc.)
  // I excluded them to keep the answer short, but keep them in your file!
  private async seedAccountsForUser(userId: string, username: string, accountTypes: AccountType[]) {
      // ... Keep your original logic ...
      // This is required for the code to compile
      // (Just copy-paste the method from your original snippet)
      return await this.accountService.findAccountsByUserId(userId) || []; // Placeholder return
  }
}