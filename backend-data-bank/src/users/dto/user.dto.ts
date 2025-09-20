import { IsNumber, IsString, Length, MinLength } from "class-validator"
 
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

    @IsNumber()
    balance: 0;


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

    @IsNumber()
    balance: Number;
        

}