import { Controller, Get, Post, Body, Param, UseGuards, Logger, HttpStatus } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionRequestDto, TransactionResponseDto } from './dto/transaction.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('transaction')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createTransactionDto: TransactionRequestDto){
    this.logger.log(`Creating transaction: ${createTransactionDto.senderAccountNumber} -> ${createTransactionDto.receiverAccountNumber}, amount: ${createTransactionDto.amount}`);
    
    const result = await this.transactionService.create(createTransactionDto);
    
    return {
      statusCode: result.status === 'PENDING' ? HttpStatus.ACCEPTED : HttpStatus.BAD_REQUEST,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching transaction ${id}`);
    const transaction = await this.transactionService.findOne(id);
    
    return {
      statusCode: HttpStatus.OK,
      data: transaction,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    this.logger.log('Fetching all transactions');
    const transactions = await this.transactionService.findAll();
    
    return {
      statusCode: HttpStatus.OK,
      data: transactions,
    };
  }
}
