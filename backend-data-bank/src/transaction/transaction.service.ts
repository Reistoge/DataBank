import { Injectable } from '@nestjs/common';
 import { TransactionRequestDto, TransactionResponseDto } from './dto/transaction.dto';
import { FraudSystemService } from 'src/fraud-system/fraud-system.service';

@Injectable()
export class TransactionService {
  constructor(fraudSystem : FraudSystemService){
    
  }
  create(txRequestDto: TransactionRequestDto) : TransactionResponseDto{
    
    return new TransactionResponseDto;
  }

  findAll() {
    return `This action returns all transaction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }


  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
