import { forwardRef, Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Card, CardSchema } from './schemas/card.schema';
import { DatabaseModule } from 'src/database/database.module';
import { AccountService } from 'src/account/account.service';
import { AccountModule } from 'src/account/account.module';
import { UserService } from 'src/users/users.service';
import { Account, AccountSchema } from 'src/account/schemas/account.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]),
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    DatabaseModule,
    forwardRef(() => AccountModule),
  ],
  controllers: [CardController],
  providers: [CardService, AccountService, UserService],
  exports: [CardService],
})
export class CardModule {}
