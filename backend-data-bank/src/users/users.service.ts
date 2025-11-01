import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UserResponse } from './dto/user.dto';
import { AccountService } from 'src/account/account.service';
import { AccountType } from 'src/account/dto/account.dto';
import { AuthPayloadDto } from 'src/auth/auth.service';
import { CreateUserNode, CypherQuery } from 'src/fraud-system/queries/cypher-query';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
  
@Injectable()
export class UsersService {

  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private accountService: AccountService,
    private neo4jService: Neo4jService,
  ) { }

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

    const q : CypherQuery<UserDocument> = new CreateUserNode(this.neo4jService, savedUser);
    q.execute();

    // Create default account for user
    await this.accountService.create({
      userId: savedUser.id,
      userNumber: savedUser.userNumber,
      type: 'CHECKING' as AccountType,
      bankBranch: userResponse.region
    });

    return userResponse;
  }
  async logoutUser(user: AuthPayloadDto) {
    await this.userModel.findOneAndUpdate({email:user.email}, {lastLogin: (new Date(Date.now()))});
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
    };
  }
}