import { Injectable } from '@nestjs/common';
import { identity } from 'rxjs';
import { AccountService } from 'src/account/account.service';
import { CardService } from 'src/card/card.service';
import { CardDocument } from 'src/card/schemas/card.schema';
import { UserDocument } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RepositoryService {
    constructor(private accountService: AccountService, private cardService: CardService) {

    }

    async getAccountByAccountNumber(accountNumber: string) {
        return this.accountService.getAccountDocumentByAccountNumber(accountNumber);
    }
    async findAccountsByAccountNumber(accountNumber: string) {
        const account = await this.accountService.getAccountDocumentByAccountNumber(accountNumber);
        return this.accountService.findAccountsByUserId(account.userId);
    }
    // async getUserByAccountNumber(accountNumber: string) : Promise<UserDocument> {
    //     return await this.accountService.getUserDocumentByAccountNumber(accountNumber);
    // }
    async findCardsByAccountNumber(accountNumber: string): Promise<CardDocument[]> {
        const { _id } = await this.accountService.getAccountDocumentByAccountNumber(accountNumber);
        return await this.cardService.findCardsDocumentByAccountId(_id.toString());
    }








}
