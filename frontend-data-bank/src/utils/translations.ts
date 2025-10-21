import type { AccountResponse, CardResponse } from "../services/dto/account.types";
import { AccountType } from "../services/dto/account.types";
import type { User } from "../types/auth.types";


type Translations<T> = Partial<Record<keyof T, string>>;

export const accountTranslations: Translations<AccountResponse> = {
    accountNumber: 'Número de Cuenta',
    balance: 'Saldo',
    type: 'Tipo de Cuenta',
    isActive: 'Estado',
} satisfies Translations<AccountResponse>;
export const userTranslations: Translations<User> = {
    username: 'Nombre',
    birthday: 'Fecha de Nacimiento',
    email: 'Email',
    rut: 'Rut',
    region:'Región',
    country:'País',
    
} satisfies Translations<User>;
export const cardTranslations: Translations<CardResponse> = {
    cvv: 'CVV',
    number: 'Número de Tarjeta',
    penalties: 'Penalizaciones',
    spentLimit: 'Límite de Gasto',
};
export const AccountTypeLabels: Record<AccountType, string> = {
    [AccountType.CHECKING]: 'Corriente',
    [AccountType.SAVINGS]: 'Ahorros',
};
export function formatAccountValue(key: keyof AccountResponse, value: any): string {
    switch (key) {
        case 'balance':
            return `$${Number(value).toFixed(2)}`;
        case 'isActive':
            return value ? 'Activa' : 'Inactiva';
        case "type": {
            const v = String(value) as keyof typeof AccountTypeLabels;
            return AccountTypeLabels[v] ?? String(value);
        }
        default:
            return String(value);
    }
}

export function translate<T>(key: keyof T, translations: Translations<T>): string {
    return translations[key] || String(key);
}

 