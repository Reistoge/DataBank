import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { LowAmount } from '../dto/fraud.dto';
import { TransactionValidator } from './transaction-validator';
import { LowAmountValidation } from './validations/low-amount.validation';

// Mock interfaces (keep existing ones)
enum MockTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

enum MockAccountState {
  DEFAULT = 'DEFAULT',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED'
}

interface MockAccount {
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
}

interface MockRequest {
  amount?: number;
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
}

interface MockSnapshot {
  request: MockRequest;
  senderAccount: MockAccount;
  receiverAccount: MockAccount;
  isFraud: boolean;
}

interface MockTransactionDocument {
  _id: Types.ObjectId;
  senderId: string;
  receiverId: string;
  status: MockTransactionStatus;
  snapshot: MockSnapshot;
  invalidDetails?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

describe('Enhanced LowAmountValidation', () => {
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
      ],
    }).compile();

    validator = module.get<TransactionValidator>(TransactionValidator);
    lowAmountValidation = module.get<LowAmountValidation>(LowAmountValidation);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LowAmountValidation', () => {
    it('should pass for amounts above threshold', async () => {
      const mockTransaction = createMockTransaction({ amount: 100 });
      const result = await lowAmountValidation.validate(mockTransaction as any);
      
      expect(result).toHaveLength(0);
    });

    it('should detect low amount (basic case)', async () => {
      const mockTransaction = createMockTransaction({ amount: 5 });
      const result = await lowAmountValidation.validate(mockTransaction as any);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LowAmount);
      expect(result[0].code).toBe('LOW_AMOUNT');
      expect(result[0].weight).toBeGreaterThan(0.1); // Should have intensity multiplier
      expect(result[0].context?.suspicionLevel).toBe('VERY_LOW');
    });

    it('should detect micro amounts with highest intensity', async () => {
      const mockTransaction = createMockTransaction({ amount: 0.5 });
      const result = await lowAmountValidation.validate(mockTransaction as any);
      
      expect(result).toHaveLength(1);
      expect(result[0].intensityMultiplier).toBe(2.5);
      expect(result[0].context?.suspicionLevel).toBe('MICRO');
      expect(result[0].dynamicSeverity).toBe(4);
    });

    it('should handle edge case: amount exactly at threshold', async () => {
      const mockTransaction = createMockTransaction({ amount: 10 });
      const result = await lowAmountValidation.validate(mockTransaction as any);
      
      expect(result).toHaveLength(0);
    });

    it('should handle invalid amounts gracefully', async () => {
      const mockTransaction = createMockTransaction({ amount: -5 });
      const result = await lowAmountValidation.validate(mockTransaction as any);
      
      expect(result).toHaveLength(0);
    });

    it('should handle missing amount in snapshot', async () => {
      const mockTransaction = createMockTransaction({});
      delete mockTransaction.snapshot.request.amount;
      const result = await lowAmountValidation.validate(mockTransaction as any);
      
      expect(result).toHaveLength(0);
    });

    it('should provide detailed context information', async () => {
      const mockTransaction = createMockTransaction({ amount: 2 });
      const result = await lowAmountValidation.validate(mockTransaction as any);
      
      expect(result[0].context).toMatchObject({
        amount: 2,
        threshold: 10,
        suspicionLevel: 'VERY_LOW',
        senderAccount: expect.any(String),
        receiverAccount: expect.any(String)
      });
    });

    it('should have proper explanation', async () => {
      const mockTransaction = createMockTransaction({ amount: 1 });
      const result = await lowAmountValidation.validate(mockTransaction as any);
      
      const explanation = result[0].getExplanation();
      expect(explanation).toContain('Transaction amount (1) is unusually low');
      expect(explanation).toContain('MICRO');
      expect(explanation).toContain('Weight:');
      expect(explanation).toContain('Intensity:');
    });
  });

  describe('Integration with TransactionValidator', () => {
    it('should work within validator framework', async () => {
      const mockTransaction = createMockTransaction({ amount: 3 });
      const result = await validator.runAll(mockTransaction as any);
      
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('LOW_AMOUNT');
    });

    it('should handle validation errors gracefully', async () => {
      const invalidTransaction = {} as any;
      const result = await validator.runAll(invalidTransaction);
      
      // Should not throw, should return empty array or handle gracefully
      expect(Array.isArray(result)).toBe(true);
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
        userId: 'user1',
        isActive: true,
        state: MockAccountState.DEFAULT
      },
      receiverAccount: {
        _id: new Types.ObjectId('000000000000000000000002'),
        accountNumber: '987654321',
        balance: 500,
        type: 'SAVINGS',
        userNumber: '1002',
        bankBranch: 'DOWNTOWN',
        userId: 'user2',
        isActive: true,
        state: MockAccountState.DEFAULT
      },
      isFraud: false
    },
    invalidDetails: undefined
  };

  // Apply overrides to request level
  if (overrides.amount !== undefined) {
    defaultTransaction.snapshot.request.amount = overrides.amount;
  }

  return defaultTransaction;
}