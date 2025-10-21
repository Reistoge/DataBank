import { PartialType } from '@nestjs/mapped-types';
import { UserResponse } from 'src/users/dto/user.dto';
export class CreateAccountDto {
    userId: string;
    type?: AccountType;
}

export class AccountResponseDto {
    id: string;
    userId: string;
    accountNumber: string;
    balance: number;
    type: AccountType;
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

}
export enum AccountState{
    DEFAULT = 'DEFAULT',
    DELETED = 'DELETED',
    BLOCKED = 'BLOCKED',
    

}

