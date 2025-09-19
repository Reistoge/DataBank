import { PartialType } from "@nestjs/mapped-types";
import { IsString } from "class-validator";
import { UserResponse } from "src/users/dto/user.dto";

export class CreateCardDto {
    @IsString()
    userId: string;

    @IsString()
    password: string;

}
export class CardResponse {

    // _id: Types.ObjectId;
    id:string | undefined;
    cvv: Number;
    number: string;
    penalties: Number;
    spentLimit: Number;

}
export class UserUpdateCardReqDto extends (CardResponse){
    
}


export class UserCardReqDto extends PartialType(UserResponse) {

}
 
