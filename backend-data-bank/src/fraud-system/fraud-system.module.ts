import { Module } from '@nestjs/common';
import { FraudSystemService } from './fraud-system.service';
import { FraudSystemController } from './fraud-system.controller';

@Module({
  controllers: [FraudSystemController],
  providers: [FraudSystemService],
})
export class FraudSystemModule {}
