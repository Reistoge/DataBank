import { IsString, Length, MinLength } from "class-validator"
import { LegacyESLint } from "eslint/use-at-your-own-risk";

export class CreateUserDto {
    @IsString()
    @Length(9)
    rut: string;


    @IsString()
    username: string;

    @IsString()
    email: string;

    @MinLength(4)
    @IsString()
    password: string;


}

export class UserResponse{
    @IsString()
    id: string;

    @IsString()
    username: string;

    @IsString()
    email: string;

    @IsString()
    @Length(9)
    rut: string;


}