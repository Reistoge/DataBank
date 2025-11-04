import { IsDate, IsNumber, IsString, Length, MinLength } from "class-validator"
import { UserRole } from "../schemas/user.schema";

export class CreateUserDto {
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

    @IsDate()
    birthday: Date;

    @IsString()
    country: string;

    @IsString()
    region: string;




}

export class UserResponse {
    @IsString()
    id: string;

    @IsString()
    username: string;

    @IsString()
    email: string;

    @IsString()
    @Length(9)
    rut: string;

    @IsDate()
    birthday?: Date;

    @IsString()
    country: string;

    @IsString()
    region: string;

    @IsString()
    roles: UserRole[];





}