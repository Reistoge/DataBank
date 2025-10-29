import { Injectable } from '@nestjs/common';
import { CreateFraudSystemDto } from './dto/create-fraud-system.dto';
import { UpdateFraudSystemDto } from './dto/update-fraud-system.dto';

@Injectable()
export class FraudSystemService {
  create(createFraudSystemDto: CreateFraudSystemDto) {
    return 'This action adds a new fraudSystem';
  }

  findAll() {
    return `This action returns all fraudSystem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fraudSystem`;
  }

  update(id: number, updateFraudSystemDto: UpdateFraudSystemDto) {
    return `This action updates a #${id} fraudSystem`;
  }

  remove(id: number) {
    return `This action removes a #${id} fraudSystem`;
  }
}
