import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { AccountModule } from 'src/account/account.module';
import { DatabaseModule } from 'src/database/database.module';
import { AdminService } from './admin/admin.service';
import { AdminController } from './admin/admin.controller';

@Module({
  imports: [
  MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  forwardRef(()=> AccountModule),
  DatabaseModule
  ],
  
  providers: [UsersService, AdminService],
  controllers: [UsersController, AdminController],
  exports: [UsersService],
})
export class UsersModule {}