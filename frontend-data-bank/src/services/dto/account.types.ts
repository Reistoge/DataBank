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

export interface UpdateAccountDto {

    id?: string
    userId?: string; // referencia al User
    accountNumber?: string;
    balance?: number;
    type?: string; // tipo de cuenta
    bankBranch?: string;
    isActive?: boolean;



}
export type AccountAdminResponse = AccountResponse & {
    state: AccountState,
    createdAt: string;
}

export type CreateCardDto = {
    accountId: string;
    accountNumber: string;
    password: string;

};


export const AccountType = {
    CHECKING: 'CHECKING',
    SAVINGS: 'SAVINGS',
    BUSINESS: 'BUSINESS',
    DEBIT: 'DEBIT',

} as const;

export const AccountState = {
    DEFAULT: 'DEFAULT',
    BLOCKED: 'BLOCKED',
    DELETED: 'DELETED',
} as const;


export type AccountState = typeof AccountState[keyof typeof AccountState];

export type AccountType = typeof AccountType[keyof typeof AccountType];


