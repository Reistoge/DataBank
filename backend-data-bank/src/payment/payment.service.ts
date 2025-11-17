// src/payment/payment.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthUserPayloadDto } from 'src/auth/auth.service';
import { CardService } from 'src/card/card.service';
import { TransactionRequestDto } from 'src/transaction/dto/transaction.dto';
import { TransactionService } from 'src/transaction/transaction.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.schema';
import { MerchantRepository } from './repository/merchant/merchant.repository';
import { Product } from './entities/product.schema';
import { ProductResponseDto } from './dto/product.dto';
import { MerchantResponseDto } from './dto/merchant.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly cardService: CardService,
    private readonly transactionService: TransactionService,
    private readonly merchantRepo: MerchantRepository,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
  ) { }

  async create(createPaymentDto: CreatePaymentDto, user: AuthUserPayloadDto) {
    // Input validation
    if (!createPaymentDto?.cardNumber || !createPaymentDto?.merchantName || !createPaymentDto?.product) {
      throw new BadRequestException('Card number, merchant name, and product are required');
    }

    if (!user?.userNumber) {
      throw new BadRequestException('User information is required');
    }

    try {
      const { cardNumber, cvv, expiryDate, password, product, merchantName, location, device, ipAddress } = createPaymentDto;

      // Get merchant
      const merchant = await this.merchantRepo.getMerchantbyName(merchantName);

      // Validate card
      const { cardDoc, accountDoc, userDoc } = await this.cardService.validateCard({
        cardNumber,
        cvv,
        expiryDate,
        password,
        user
      });

      this.logger.log(`Card validation success: card:${cardDoc.number}->account:${accountDoc.accountNumber}->user:${userDoc.userNumber}`);

      // Validate product price
      if (!product.price || product.price <= 0) {
        throw new BadRequestException('Product price must be greater than zero');
      }

      // Check balance
      if (product.price > accountDoc.balance) {
        throw new BadRequestException('Insufficient balance for this payment');
      }

      // Create transaction request
      const tx: TransactionRequestDto = {
        senderAccountNumber: accountDoc.accountNumber,
        receiverAccountNumber: merchant.accountNumber,
        amount: product.price,
        type: 'PAYMENT',
        merchantCategory: merchant.category,
        location: location || 'Unknown',
        currency: 'USD',
        description: `Payment for ${product.name}`,
        receiverContact: merchant.contact,
        receiverEmail: merchant.email,
        device: device || 'Unknown',
        ipAddress: ipAddress || 'Unknown',
      };

      // Process transaction
      const txResponse = await this.transactionService.create(user.userNumber, tx);

      // Check transaction response
      if (!txResponse?.transactionId || txResponse.transactionId === '-1') {
        throw new InternalServerErrorException('Transaction processing failed');
      }

      // Create payment record
      const payment: Payment = {
        merchantId: merchant.id.toString(), // Fixed: use _id instead of id
        product: product,
        orderNumber: await this.generateUniqueOrderNumber(),
        txId: txResponse.transactionId,
      } as Payment;

      await new this.paymentModel(payment).save();

      this.logger.log(`Payment created successfully: orderNumber=${payment.orderNumber}, txId=${payment.txId}`);

      return {
        product: payment.product,
        orderNumber: payment.orderNumber,
        transactionId: txResponse.transactionId.toString(),
        merchant: {
          name: merchant.name,
          category: merchant.category,
          contact: merchant.contact,
          email: merchant.email,
        }
      };

    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(`Payment creation failed: ${error?.message}`);
      throw new InternalServerErrorException('Payment processing failed due to system error');
    }
  }

  private async generateUniqueOrderNumber(): Promise<string> {
    const MAX_ATTEMPTS = 100;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      try {
        const orderNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
        const exists = await this.paymentModel.exists({ orderNumber });

        if (!exists) {
          return orderNumber;
        }

        attempts++;
      } catch (error) {
        this.logger.error(`Error generating order number: ${error?.message}`);
        throw new InternalServerErrorException('Failed to generate unique order number');
      }
    }

    throw new InternalServerErrorException('Unable to generate unique order number after multiple attempts');
  }







}