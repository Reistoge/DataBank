import { ACCOUNT_ROUTES, CARD_ROUTES } from "../utils/constants";
import { createAuthHeaders } from "../utils/storage";
import type {
  AccountResponse,
  CardResponse,
  CreateAccountDto,
  CreateCardDto,
} from "./dto/account.types";

// Get all accounts for the authenticated user (JWT in header)
export const getUserAccounts = async (): Promise<AccountResponse[]> => {
  const response = await fetch(ACCOUNT_ROUTES.GET_ACCOUNTS, {
    method: "GET",
    headers: createAuthHeaders(),
  });
  if (!response.ok) throw new Error("getAccounts failed");
  return response.json();
};

// Get all cards for a specific account
export const getCards = async (accountId: string): Promise<CardResponse[]> => {
  const response = await fetch(
    `${CARD_ROUTES.GET_CARDS}?accountId=${accountId}`,
    {
      method: "GET",
      headers: createAuthHeaders(),
    }
  );
  if (!response.ok) throw new Error("getCards failed");
  return response.json();
};

// Create a new account for the authenticated user
export const createAccount = async (dto: CreateAccountDto): Promise<AccountResponse> => {
  const response = await fetch(ACCOUNT_ROUTES.CREATE_ACCOUNT, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(dto),
  });
  if (!response.ok) throw new Error("createAccount failed");
  return response.json();
};


// Create a new card for a specific account
export const createCard = async (dto: CreateCardDto): Promise<CardResponse> => {
  const response = await fetch(CARD_ROUTES.CREATE_CARD, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(dto),
  });
  if (!response.ok) throw new Error("createCard failed");
  return response.json();
};