import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import { CardService } from 'src/card/card.service';
import { CardModule } from 'src/card/card.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]), CardModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports:[AccountService]
})
export class AccountModule { }
