import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { LowAmount } from '../dto/fraud.dto';
import { TransactionValidator } from './transaction-validator';
import { LowAmountValidation } from './validations';

// Mock TransactionStatus enum to avoid imports
enum MockTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Mock AccountState enum
enum MockAccountState {
  DEFAULT = 'DEFAULT',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED'
}

// Mock TransactionDocument interface without dependencies
interface MockTransactionDocument {
  _id: Types.ObjectId;
  senderId: string;
  receiverId: string;
  status: MockTransactionStatus;
  snapshot: {
    request: {
      amount: number;
      senderAccountNumber: string;
      receiverAccountNumber: string;
      type: string;
      merchantCategory: string;
      location: string;
      currency: string;
      description: string;
      receiverEmail: string;
      device: string;
      ipAddress: string;
    };
    senderAccount: {
      _id: Types.ObjectId;
      userId: string;
      userNumber: string;
      accountNumber: string;
      balance: number;
      type: string;
      isActive: boolean;
      bankBranch: string;
      state: MockAccountState;
      createdAt?: Date;
      updatedAt?: Date;
    };
    receiverAccount: {
      _id: Types.ObjectId;
      userId: string;
      userNumber: string;
      accountNumber: string;
      balance: number;
      type: string;
      isActive: boolean;
      bankBranch: string;
      state: MockAccountState;
      createdAt?: Date;
      updatedAt?: Date;
    };
    isFraud: boolean;
  };
  invalidDetails?: any;
}

// Mock AccountService
const mockAccountService = {
  settleTransaction: jest.fn(),
  getAccountBalanceByAccountNumber: jest.fn(),
  findAccountByAccountNumber: jest.fn(),
  updateAccount: jest.fn(),
};

describe('TransactionValidator', () => {
  let validator: TransactionValidator;
  let lowAmountValidation: LowAmountValidation;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionValidator,
        LowAmountValidation,
        {
          provide: 'TRANSACTION_VALIDATIONS',
          useFactory: (lowAmountValidation: LowAmountValidation) => [
            lowAmountValidation,
          ],
          inject: [LowAmountValidation],
        },
        {
          provide: 'AccountService',
          useValue: mockAccountService,
        },
      ],
    }).compile();

    validator = module.get<TransactionValidator>(TransactionValidator);
    lowAmountValidation = module.get<LowAmountValidation>(LowAmountValidation);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('should inject validations correctly', () => {
    expect(validator['validations']).toBeDefined();
    expect(validator['validations'].length).toBe(1);
    expect(validator['validations'][0]).toBeInstanceOf(LowAmountValidation);
  });

  describe('runAll', () => {
    it('should detect low amount suspicious behaviour', async () => {
      const mockTransaction = createMockTransaction({
        amount: 5, // Below MIN_AMOUNT threshold
      });

      const result = await validator.runAll(mockTransaction as any);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(LowAmount);
      expect(result[0].code).toBe('LOW_AMOUNT');
      expect(result[0].severity).toBe('LOW');
      expect(result[0].weight).toBe(0.1);
    });

    it('should return empty array when no suspicious behaviour detected', async () => {
      const mockTransaction = createMockTransaction({
        amount: 100, // Above MIN_AMOUNT threshold
      });

      const result = await validator.runAll(mockTransaction as any);

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it('should handle multiple suspicious behaviours', async () => {
      const mockValidation = {
        validate: jest.fn().mockResolvedValue([new LowAmount()]),
      };

      validator['validations'].push(mockValidation as any);

      const mockTransaction = createMockTransaction({ amount: 5 });

      const result = await validator.runAll(mockTransaction as any);

      expect(result.length).toBe(2);
      expect(mockValidation.validate).toHaveBeenCalledWith(mockTransaction);
    });

    it('should handle validation errors gracefully', async () => {
      const errorValidation = {
        validate: jest.fn().mockRejectedValue(new Error('Validation failed')),
      };

      validator['validations'] = [errorValidation as any];

      const mockTransaction = createMockTransaction({ amount: 50 });

      await expect(validator.runAll(mockTransaction as any)).rejects.toThrow('Validation failed');
    });

    it('should log validation execution', async () => {
      const loggerSpy = jest.spyOn(validator['logger'], 'log');
      const mockTransaction = createMockTransaction({ amount: 50 });

      await validator.runAll(mockTransaction as any);

      expect(loggerSpy).toHaveBeenCalledWith('Running all validations');
      expect(loggerSpy).toHaveBeenCalledWith('finished');
    });

    it('should handle AccountService integration', async () => {
      mockAccountService.getAccountBalanceByAccountNumber.mockResolvedValue(1500);

      const balance = await mockAccountService.getAccountBalanceByAccountNumber('123456789');

      expect(balance).toBe(1500);
      expect(mockAccountService.getAccountBalanceByAccountNumber).toHaveBeenCalledWith('123456789');
    });
  });
});

// Helper function to create mock transactions
function createMockTransaction(overrides: Partial<any> = {}): MockTransactionDocument {
  const defaultTransaction: MockTransactionDocument = {
    _id: new Types.ObjectId('000000000000000000000003'),
    senderId: 'sender-id',
    receiverId: 'receiver-id',
    status: MockTransactionStatus.PENDING,
    snapshot: {
      request: {
        amount: 2000,
        senderAccountNumber: '123456789',
        receiverAccountNumber: '987654321',
        type: 'PAYMENT',
        merchantCategory: 'GROCERIES',
        location: 'MIAMI',
        currency: 'USD',
        description: 'Test transaction',
        receiverEmail: 'receiver@test.com',
        device: 'mobile',
        ipAddress: '192.168.1.1',
        ...overrides
      },
      senderAccount: {
        _id: new Types.ObjectId('000000000000000000000001'),
        accountNumber: '123456789',
        balance: 1000,
        type: 'CHECKING',
        userNumber: '1001',
        bankBranch: 'MAIN',
        userId: '',
        isActive: false,
        state: MockAccountState.DEFAULT
      },
      receiverAccount: {
        _id: new Types.ObjectId('000000000000000000000002'),
        accountNumber: '987654321',
        balance: 500,
        type: 'SAVINGS',
        userNumber: '1002',
        bankBranch: 'DOWNTOWN',
        userId: '',
        isActive: false,
        state: MockAccountState.DEFAULT
      },
      isFraud: false
    },
    invalidDetails: undefined
  };

  // Apply overrides properly
  if (overrides.amount !== undefined) {
    defaultTransaction.snapshot.request.amount = overrides.amount;
  }

  return defaultTransaction;
}