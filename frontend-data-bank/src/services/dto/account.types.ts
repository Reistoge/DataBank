export type AccountResponse = {
    id: string;
    userId: string;
    accountNumber: string;
    balance: number;
    type: string;
    bankBranch: string
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
    bankBranch?: string;

};

export type CreateCardDto = {
    accountId: string;
    accountNumber:string;
    password: string;

};


export const AccountType = {
    CHECKING: 'CHECKING' ,
    SAVINGS: 'SAVINGS',
    BUSINESS: 'BUSINESS'

} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

 
