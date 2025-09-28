
import { json } from "stream/consumers";
import { ACCOUNT_ROUTES, CARD_ROUTES, USER_ROUTES } from "../utils/constants";
import { apiEndpoints, createAuthHeaders } from "../utils/storage";
import type { User } from "../types/auth.types";
import type { AccountResponse, CreateCard, CardResponse } from "./dto/account.types";


export const getProfile = async () => {
    const response = await fetch(USER_ROUTES.GET_PROFILE, {
        method: 'GET',
        headers: createAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'getProfile failed to fetch');
    }
    return response.json()

}
export const createAccount = async (user: User): Promise<AccountResponse> => {
    const response = await fetch(ACCOUNT_ROUTES.CREATE_ACCOUNT, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(user)

    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'getAccounts failed to fetch');
    }
    return response.json();
}
export const getUserAccounts = async (user: User): Promise<AccountResponse[]> => {
    const response = await fetch(ACCOUNT_ROUTES.GET_ACCOUNTS, {
        method: 'GET',
        headers: createAuthHeaders(),
        body: JSON.stringify(user),


    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'getAccounts failed to fetch');
    }
    return response.json();


}
export const getCards = async (account: AccountResponse): Promise<CardResponse[]> => {
    const response = await fetch(CARD_ROUTES.GET_CARDS, {
        method: 'GET',
        headers: createAuthHeaders(),
        body: JSON.stringify(account),

    })
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'get card failed to fetch')
    }
    return response.json();

}
export const createCard = async (createCardDto: CreateCard): Promise<CardResponse> => {
    const response = await fetch(CARD_ROUTES.CREATE_CARD, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(createCardDto),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'create card failed to fetch');
    }
    return response.json();

}


