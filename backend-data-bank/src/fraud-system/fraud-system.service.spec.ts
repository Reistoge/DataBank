import { Test, TestingModule } from '@nestjs/testing';
import { FraudSystemService } from './fraud-system.service';

describe('FraudSystemService', () => {
  let service: FraudSystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FraudSystemService],
    }).compile();

    service = module.get<FraudSystemService>(FraudSystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});