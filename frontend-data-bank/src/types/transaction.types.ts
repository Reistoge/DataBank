export type TransactionRequest = {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  type: string;
  merchantCategory: string;
  location: string;
  currency: string;
  description: string;
  receiverContact: string;
  receiverEmail: string;
  device: string;
  ipAddress: string;
};

export type StartTransactionResponse = {
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  message: string;
};

export type TransactionSnapshot = {
  isFraud: boolean;
  request: {
    senderAccountNumber: string;
    receiverAccountNumber: string;
    amount: number;
    type: string;
    merchantCategory: string;
    location: string;
    currency: string;
    description: string;
    receiverContact: string;
    receiverEmail: string;
    device: string;
    ipAddress: string;
  };
  receiverAccount: {
    accountNumber: string;
    balance: number;
    type: string;
    bankBranch: string;
    [key: string]: any;
  };
  senderAccount: {
    accountNumber: string;
    balance: number;
    type: string;
    bankBranch: string;
    [key: string]: any;
  };
  fraudResult: {
    isFraud: boolean;
    probabilitySuspicious: number;
    behaviours: any[];
    recommendation: string;
  };
};

export type TransactionHistoryItem = {
  tx: {
    transactionId: string;
    status: string;
    createdAt: string;
    snapshot: string; // JSON string that needs to be parsed
  };
  direction: string; // "OUT: accountNumber" or "GAIN: accountNumber"
};

export type TransactionHistory = TransactionHistoryItem[];