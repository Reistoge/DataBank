export type AccountResponse = {
    id: string
    userId: string; // referencia al User
    accountNumber: string;
    balance: number;
    type: string; // tipo de cuenta
    isActive: boolean;

}

export type CardResponse = {

    // _id: Types.ObjectId;
    id: string | undefined;
    cvv: Number;
    number: string;
    penalties: Number;
    spentLimit: Number;

}
export type CreateCard = AccountResponse & {
    password: string;
};