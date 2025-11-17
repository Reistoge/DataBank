import { Test, TestingModule } from '@nestjs/testing';
import { MerchantRepository } from './merchant.repository';

describe('MerchantService', () => {
  let service: MerchantRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerchantRepository],
    }).compile();

    service = module.get<MerchantRepository>(MerchantRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
