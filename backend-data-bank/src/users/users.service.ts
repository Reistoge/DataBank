import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UserResponse } from './dto/user.dto';
import { AccountService } from 'src/account/account.service';
import { AccountType } from 'src/account/dto/account.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private accountService: AccountService
  ) {}

  async create(userData: CreateUserDto): Promise<UserResponse> {
    this.logger.log(`Creating user: ${userData.email}`);
    const newUser = new this.userModel(userData);
    const savedUser = await newUser.save();
    this.logger.log(`User ${savedUser.id} saved with no errors`);
    const userResponse = this.toResponseDto(savedUser);

    // Create default account for user
    await this.accountService.create({
      userId: userResponse.id,
      type: 'CHECKING' as AccountType,
    });

    return userResponse;
  }

  async findOne(username: string): Promise<UserResponse | null> {
    const user = await this.userModel.findOne({ username }).exec();
    return user ? this.toResponseDto(user) : null;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByRut(rut: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ rut }).exec();
  }

  async findById(id: string): Promise<UserResponse | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toResponseDto(user) : null;
  }

  async findAll(): Promise<UserResponse[]> {
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