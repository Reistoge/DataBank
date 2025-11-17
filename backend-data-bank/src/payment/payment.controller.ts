import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthUserPayloadDto } from 'src/auth/auth.service';
import { User } from 'src/users/decorator/user.guard';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @User() user: AuthUserPayloadDto,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return await this.paymentService.create(createPaymentDto, user);
  }
}
