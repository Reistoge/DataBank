import { IsString, Length, MinLength, isEmail } from "class-validator";
import { Types } from "mongoose";
import { CreateUserDto,UserResponse } from "src/users/dto/user.dto";
// LOGIN DATA TRANSFER OBJECT
export class LoginDto {
  @IsString()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
// REGISTER DATA TRANSFER OBJECT
export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  
  @IsString()
  @Length(9)
  rut: string;


  @IsString()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;


}

// AUTH RESPONSE DATA TRANSFER OBJECT
export class AuthResponseDto{
  user: UserResponse;
  access_token: string;
}