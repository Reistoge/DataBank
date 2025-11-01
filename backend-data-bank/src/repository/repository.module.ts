import { Module } from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Card, CardSchema } from 'src/card/schemas/card.schema';
import { Account, AccountSchema } from 'src/account/schemas/account.schema';
import { DatabaseModule } from 'src/database/database.module';
import { UsersModule } from 'src/users/users.module';
import { CardModule } from 'src/card/card.module';
import { AccountModule } from 'src/account/account.module';
import { UsersService } from 'src/users/users.service';
import { CardService } from 'src/card/card.service';
import { AccountService } from 'src/account/account.service';

@Module({
    imports: [
        DatabaseModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]),
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
        UsersModule,
        CardModule,
        AccountModule,

    ],
    providers: [RepositoryService, UsersService, CardService, AccountService],
    exports: [RepositoryService]
})
export class RepositoryModule {}
