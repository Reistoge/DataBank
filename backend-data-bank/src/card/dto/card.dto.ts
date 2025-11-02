import { PartialType } from "@nestjs/mapped-types";
import { IsString } from "class-validator";
import { AccountResponseDto } from "src/account/dto/account.dto";
import { UserResponse } from "src/users/dto/user.dto";
export class CardResponse {

    id: string | undefined;
    cvv: Number;
    number: string;
    penalties: Number;
    spentLimit: Number;

}

export class CreateCardDto extends PartialType(AccountResponseDto) {
    @IsString()
    password: string;
    @IsString()
    accountId: string;
    @IsString()
    accountNumber: string;


}

export class UserUpdateCardReqDto extends PartialType(CardResponse) {

}


export class CardReqDto extends PartialType(AccountResponseDto) {

}
export enum CardState {
    DEFAULT = 'DEFAULT',
    BLOCKED = 'BLOCKED',
    DELETED = 'DELETED',
}
