import { Test, TestingModule } from '@nestjs/testing';
import { FraudSystemController } from './fraud-system.controller';
import { FraudSystemService } from './fraud-system.service';

describe('FraudSystemController', () => {
  let controller: FraudSystemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FraudSystemController],
      providers: [FraudSystemService],
    }).compile();

    controller = module.get<FraudSystemController>(FraudSystemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
