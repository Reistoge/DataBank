import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  Logger,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  TransactionRequestDto,
  TransactionResponseDto,
} from './dto/transaction.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/roles/roles.guard';
import { AuthUserPayloadDto } from 'src/auth/auth.service';
import { User } from 'src/users/decorator/user.guard';

@Controller('transaction')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @User() user: AuthUserPayloadDto,
    @Body() createTransactionDto: TransactionRequestDto,
  ) {
    this.logger.log(
      `Creating transaction: ${createTransactionDto.senderAccountNumber} -> ${createTransactionDto.receiverAccountNumber}, amount: ${createTransactionDto.amount}`,
    );
    try {
      // extract user number
      if (user.userNumber) {
        // extract user number to check if tx sender and user are valid
        const result = await this.transactionService.create(
          user.userNumber,
          createTransactionDto,
        );
        return {
          statusCode:
            result.status === 'PENDING'
              ? HttpStatus.ACCEPTED
              : HttpStatus.BAD_REQUEST,
          data: result,
        };
      } else {
        throw new BadRequestException();
      }
    } catch (err) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        data: null,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':accountNumber/history')
  async getTransactionHistory(@Param('accountNumber') accountNumber: string) {
    return this.transactionService.getTransactionHistory(accountNumber);
  }

  // @UseGuards(JwtAuthGuard, RoleGuard)
  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   this.logger.log(`Fetching transaction ${id}`);
  //   const transaction = await this.transactionService.findOne(id);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     data: transaction,
  //   };
  // }

  // @UseGuards(JwtAuthGuard, RoleGuard)
  // @Get()
  // async findAll() {
  //   this.logger.log('Fetching all transactions');
  //   const transactions = await this.transactionService.findAll();

  //   return {
  //     statusCode: HttpStatus.OK,
  //     data: transactions,
  //   };
  // }
}
