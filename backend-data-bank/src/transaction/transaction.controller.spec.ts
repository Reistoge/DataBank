import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { ModuleMocker, MockMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      
      controllers: [TransactionController],

    }).useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === TransactionService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(
            mockMetadata,
          ) as ObjectConstructor;
          return new Mock();
        }
      })
    .compile();

  controller = module.get<TransactionController>(TransactionController);
});

it('should be defined', () => {
  expect(controller).toBeDefined();
});
});
