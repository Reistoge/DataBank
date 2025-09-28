import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
 import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { AccountService } from 'src/account/account.service';
import { AccountModule } from 'src/account/account.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  AccountModule],

  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}