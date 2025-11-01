import { PartialType } from '@nestjs/mapped-types';
import { UserResponse } from 'src/users/dto/user.dto';
export class CreateAccountDto {
    userId: string;
    userNumber:string
    type?: AccountType;
    bankBranch?: string;
}

export class AccountResponseDto {
    id: string;
    userId: string;
    accountNumber: string;
    balance: number;
    type: AccountType;
    bankBranch: string;
    isActive: boolean;

}
export class UpdateAccountDto {
    id: string;
    userId?: string;
    accountNumber?: string;
    balance?: number;
    type?: AccountType;
    isActive?: boolean;
    // Add other fields as needed for updating an account
}

export enum AccountType {
    SAVINGS = 'SAVINGS',
    CHECKING = 'CHECKING',
    BUSINESS = 'BUSINESS',

}
export enum AccountState{
    DEFAULT = 'DEFAULT',
    DELETED = 'DELETED',
    BLOCKED = 'BLOCKED',
    

}

