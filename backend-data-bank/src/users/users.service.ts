import { forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UserResponse } from './dto/user.dto';
import { AccountService } from 'src/account/account.service';
import { AccountType } from 'src/account/dto/account.dto';
import { AuthUserPayloadDto } from 'src/auth/auth.service';
import { CreateUserNode, CypherQuery } from 'src/fraud-system/queries/cypher-query';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';

@Injectable()
export class UserService {
  async updateContacts(userNumber: string, contacts: Contact[]) {
    try {
      const user = await this.userModel.findOneAndUpdate(
        { userNumber }, 
        { contacts: contacts },
        { new: true }  
      ).exec();
      
      if (!user) {
        throw new NotFoundException(`User not found while updating contacts`);
      }
      
      return user; 
    } catch (err) {
   
      throw err instanceof HttpException 
        ? err 
        : new InternalServerErrorException(`Error while updating user contacts`);
    }

  }
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => AccountService))
    private accountService: AccountService,
    private neo4jService: Neo4jService,
  ) { }


  async getContacts(userNumber: string) {
    try {
      const user = await this.userModel.findOne({ userNumber }).exec();
      if (!user) {
        throw new NotFoundException(`User not found while getting contacts`);
      }
      return user.contacts;
    }
    catch (err) {
      err instanceof HttpException ? err : new InternalServerErrorException(`error while getting user contacts`);
    }
  }
  async addContact(userNumber: string, contact: Contact) {
    try {
      const user = await this.userModel.findOne({ userNumber }).exec();
      if (!user) {
        throw new NotFoundException(`User not found while adding a contact`);
      }
      if (!user.contacts.find((u) => u.accountNumber === contact.accountNumber)) {
        user.contacts.push(contact);
      }
      await user.save();
    }
    catch (err) {
      throw err instanceof HttpException ? err : new InternalServerErrorException(`error while adding user contacts`);
    }
  }
  async hasAccount(accountNumber: string, userNumber: string): Promise<boolean> {
    try {
      if ((await this.accountService.getUserByAccountNumber(accountNumber)).userNumber === userNumber) {
        return true;
      } else {
        return false;
      }

    } catch (error) {
      this.logger.warn(`Error checking account existance for user: ${error}`);
      return false;
    }
  }
  async updateUserById(id: string, user: UserDocument | null) {
    const u = await this.getUserById(id);
    this.logger.warn(`Updating ${u} with new data: ${user}`);
    await this.userModel.findByIdAndUpdate(id, { ...user }).exec();
    const newSavedUser = await this.getUserById(id);

    this.logger.log(`data updated succesfully ${newSavedUser}`);
    return newSavedUser;

  }



  async create(userData: CreateUserDto): Promise<UserResponse> {
    this.logger.log(`Creating user: ${userData.email}`);

    const userNumber = await this.generateUniqueUserIdentifier();
    const newUser = {
      ...userData,
      userNumber
    }
    //const newUser = new this.userModel(userData);
    const savedUser = await new this.userModel(newUser).save();
    this.logger.log(`User ${savedUser.id} saved with no errors`);

    const userResponse = this.toResponseDto(savedUser);
    try {
      this.logger.log(`creaing user node`);
      const q: CypherQuery<UserDocument> = new CreateUserNode(this.neo4jService, savedUser);
      const records = q.execute();
      this.logger.log(`records ${records.toString()}`);

    } catch (err) {
      this.logger.warn(`Error while storing user in neo4j`);
    }

    // Create default account for user
    await this.accountService.create({
      userId: savedUser.id,
      userNumber: savedUser.userNumber,
      type: 'DEBIT' as AccountType,
      bankBranch: userResponse.region
    });

    return userResponse;
  }
  async logoutUser(user: AuthUserPayloadDto) {
    await this.userModel.findOneAndUpdate({ email: user.email }, { lastLogin: (new Date(Date.now())) });
  }
  async getUserByUsername(username: string): Promise<UserResponse | null> {
    const user = await this.userModel.findOne({ username }).exec();
    return user ? this.toResponseDto(user) : null;
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async getUserDocumentByRut(rut: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ rut }).exec();
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toResponseDto(user) : null;
  }

  async getUserDocumentById(id: string): Promise<UserDocument> {
    const user: UserDocument | null = await this.userModel.findById(id).exec();
    if (user) {
      return user;
    } else {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
  private async generateUniqueUserIdentifier(): Promise<string> {
    let identifier: string;
    let exists: { _id: any } | null;
    do {
      identifier = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      exists = await this.userModel.exists({ identifier });
    } while (exists);
    return identifier;
  }


  async findAllUsers(): Promise<UserResponse[]> {
    const users = await this.userModel.find().select('-password').exec();
    return users.map(u => this.toResponseDto(u));
  }

  private toResponseDto(user: UserDocument): UserResponse {
    return {
      rut: user.rut,
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      country: user.country,
      region: user.region,
      birthday: user.birthday,
      roles: user.roles,
    };
  }
}