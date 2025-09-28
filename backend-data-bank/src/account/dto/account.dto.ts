import { PartialType } from '@nestjs/mapped-types';
import { UserResponse } from 'src/users/dto/user.dto';
 export class AccountResponseDto {
    id: string;
    userId: string; // referencia al User
    accountNumber: string;
    balance: number;
    type: string; // tipo de cuenta
    isActive: boolean;

}
export class CreateAccountDto extends PartialType(UserResponse) {
    type?: AccountType;
     
}

export class UpdateAccountDto extends PartialType(AccountResponseDto) { }

export class AccountReqDto extends PartialType(UserResponse){}

export enum AccountType {
    SAVINGS = 'SAVINGS',
    CHECKING = 'CHECKING',
 
}
