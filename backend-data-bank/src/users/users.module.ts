import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { AccountModule } from 'src/account/account.module';
import { DatabaseModule } from 'src/database/database.module';
import { AdminService } from './admin/admin.service';
import { AdminController } from './admin/admin.controller';
import { MerchantController } from './merchant/merchant.controller';
import { MerchantService } from './merchant/merchant.service';
import { MerchantRepository } from 'src/payment/repository/merchant/merchant.repository';
import { Merchant, MerchantSchema } from 'src/payment/entities/merchant.schema';
import { Product, ProductSchema } from 'src/payment/entities/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Merchant.name, schema: MerchantSchema },
    ]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    forwardRef(() => AccountModule),
    DatabaseModule,
  ],

  providers: [UserService, AdminService, MerchantService, MerchantRepository],
  controllers: [UsersController, AdminController, MerchantController],
  exports: [UserService],
})
export class UsersModule {}
