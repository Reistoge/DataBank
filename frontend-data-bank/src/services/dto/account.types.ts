export type AccountResponse = {
    id: string;
    userId: string;
    accountNumber: string;
    balance: number;
    type: string;
    isActive: boolean;
};

export type CardResponse = {
    id: string;
    cvv: number;
    number: string;
    penalties: number;
    spentLimit: number;
};

export type CreateAccountDto = {
    type?: string;
};

export type CreateCardDto = {
    accountId: string;
    password: string;
};


export const AccountType = {
    CHECKING: 'CHECKING',
    SAVINGS: 'SAVINGS',
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];


 