// auth/auth.service.ts
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { UserDocument } from 'src/users/schemas/user.schema';
import { UserResponse } from 'src/users/dto/user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { rut, username, email, password, birthday, country, region, } = registerDto;
    this.logger.log(`Registration attempt for email: ${email} with rut ${rut}`);

    const existingUser = await this.usersService.findByEmail(email);


    if (existingUser) {
      this.logger.warn(`Registration failed: User with email ${email} already exists`);
      throw new ConflictException(`User with this email already exists`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await this.usersService.create({
      rut,
      username,
      email,
      password: hashedPassword,
      birthday,
      country,
      region,




    });

    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return { user, access_token };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    this.logger.log(`Login attempt for email: ${email}`);

    const userDoc = await this.usersService.findByEmail(email);
    if (!userDoc) throw new UnauthorizedException(`Invalid credentials`);

    const isPasswordValid = await bcrypt.compare(password, userDoc.password);
    if (!isPasswordValid) throw new UnauthorizedException(`Invalid credentials`);

    this.logger.log(`User logged in successfully: ${email}`);
    userDoc.lastLogin = new Date();
    await userDoc.save();
    const payload = { email: userDoc.email, sub: userDoc._id };
    const access_token = this.jwtService.sign(payload);
    const user = this.toUserResponse(userDoc);

    return {
      user,
      access_token,
    };
  }

  async validateUser(email: string, sub: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && user._id.toString() === sub.toString()) {
      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        rut: user.rut,
      };
    }
    return null;
  }

  toUserResponse(doc: UserDocument): UserResponse {
    
    return {
      id: doc._id.toString(),
      rut: doc.rut,
      username: doc.username,
      email: doc.email,
      birthday: doc.birthday,
      country: doc.country,
      region: doc.region,
    };

  }
}
