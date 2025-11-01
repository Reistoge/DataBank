import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { AccountModule } from 'src/account/account.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
  MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  forwardRef(()=> AccountModule),
  DatabaseModule
  ],
  
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}