import type { Account } from "../types/auth.types";
import { ACCOUNT_ROUTES, ADMIN_ROUTES, API_BASE_URL, CARD_ROUTES } from "../utils/constants";
import { createAuthHeaders, tokenStorage } from "../utils/storage";
import type {
  AccountAdminResponse,
  AccountResponse,
  CardResponse,
  CreateAccountDto,
  CreateCardDto,
} from "./dto/account.types";

// Get all accounts for the authenticated user (JWT in header)
export const getUserAccounts = async (): Promise<AccountResponse[]> => {
  const headers = createAuthHeaders();
  console.log("headers:", headers);

  const response = await fetch(API_BASE_URL + ACCOUNT_ROUTES.GET_ACCOUNTS, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) throw new Error("getAccounts failed");
  const result = await response.json();
  console.log(`result ${result}`);
  return result;
};
export const deleteAccount = async (accountId: string | undefined) => {
  if (!accountId) throw new Error("accountId no provided ");
  const headers = createAuthHeaders();
  const response = await fetch(`${API_BASE_URL + ACCOUNT_ROUTES.DELETE_ACCOUNT}/${accountId} `, {
    method: 'DELETE',
    headers: headers
  });
  if (!response.ok) throw new Error("deleteAccount failed");

  const result = await response.json();
  return result;


}

// Get all cards for a specific account
export const getCards = async (accountId: string): Promise<CardResponse[]> => {
  const response = await fetch(
    `${API_BASE_URL + CARD_ROUTES.GET_CARDS}?accountId=${accountId}`,
    {
      method: "GET",
      headers: createAuthHeaders(),
    }
  );
  if (!response.ok) throw new Error("getCards failed");
  return await response.json();
};
// Update an existing account for Admin
export const updateAccount = async (dto: Account): Promise<Account> => {
  const response = await fetch(API_BASE_URL + ACCOUNT_ROUTES.UPDATE_ACCOUNT, {
    method: "PATCH",
    headers: createAuthHeaders(),
    body: JSON.stringify(dto),
  });
  if (!response.ok) throw new Error("updateAccount failed");
  const result = await response.json();
  return result;
};
// Create a new account for the authenticated user
export const createAccount = async (dto: CreateAccountDto): Promise<AccountResponse> => {
  const response = await fetch(API_BASE_URL + ACCOUNT_ROUTES.CREATE_ACCOUNT, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(dto),
  });
  if (!response.ok) throw new Error("createAccount failed");
  return await response.json();
};


// Create a new card for a specific account
export const createCard = async (dto: CreateCardDto): Promise<CardResponse> => {
  Object.entries(dto).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  const response = await fetch(API_BASE_URL + CARD_ROUTES.CREATE_CARD, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(dto),
  });
  if (!response.ok) throw new Error("createCard failed");
  return await response.json();
};

export const updateCard = async (dto: CardResponse, accessPassword: string) => {
  Object.entries(dto).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  const updateCardReq = {
    ...dto,
    accessPassword,
  }
  const response = await fetch(API_BASE_URL + CARD_ROUTES.UPDATE_CARD, {
    method: "PATCH",
    headers: createAuthHeaders(),
    body: JSON.stringify(updateCardReq),
  });
  if (!response.ok) {
    console.error(response.text);
    throw new Error(`update card Error`);
  };


}
export const deleteCard = async (cardId: string, accessPassword: string) => {
  const response = await fetch(
    `${API_BASE_URL + CARD_ROUTES.DELETE_CARD}/${cardId}?password=${accessPassword}`,
    {
      method: "DELETE",
      headers: createAuthHeaders(),
    }
  );
  if (!response.ok) {
    console.error(response.statusText);
    throw new Error("deleteCard failed");
  }
  return await response.json();
};


export const updateCardSpentLimit = async (dto: CardResponse, newLimit: number, accessPassword: string) => {
  const copy = { ...dto };
  copy.spentLimit = newLimit;

  return await updateCard(copy, accessPassword);
}
export const getAllAccountsAdmin = async (): Promise<AccountAdminResponse[]> => {
  const response = await fetch(API_BASE_URL + ADMIN_ROUTES.FIND_ALL_ACCOUNTS, {
    method: "GET",
    headers: createAuthHeaders(),
  });
  if (!response.ok) throw new Error("getAllAccountsAdmin failed");
  return await response.json();
};