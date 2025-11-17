import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { AccountModule } from 'src/account/account.module';
import { CardModule } from 'src/card/card.module';
import { SeederService } from './seeder.service';
import { Merchant, MerchantSchema } from 'src/payment/entities/merchant.schema';
import { Product, ProductSchema } from 'src/payment/entities/product.schema';
import { MerchantService } from 'src/users/merchant/merchant.service';
import { MerchantRepository } from 'src/payment/repository/merchant/merchant.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Merchant.name, schema: MerchantSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    UsersModule,
    AccountModule,
    CardModule,
  ],
  providers: [SeederService, MerchantService, MerchantRepository],
  exports: [SeederService],
})
export class SeederModule {}
