import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MerchantRepository } from './repository/merchant/merchant.repository';
import { Payment, PaymentSchema } from './entities/payment.schema';
import { Merchant, MerchantSchema } from './entities/merchant.schema';
import { Product, ProductSchema } from './entities/product.schema';
import { CardModule } from 'src/card/card.module';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
  imports: [
    // Register all schemas
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Merchant.name, schema: MerchantSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    // Import required modules
    CardModule,
    TransactionModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, MerchantRepository],
  exports: [PaymentService, MerchantRepository],
})
export class PaymentModule {}