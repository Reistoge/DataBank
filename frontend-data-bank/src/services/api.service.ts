import type { Account, Contact } from "../types/auth.types";
import type { Product, Merchant } from "../types/payment.types";
import type { TransactionRequest, StartTransactionResponse, TransactionHistory } from "../types/transaction.types";
import { ACCOUNT_ROUTES, ADMIN_ROUTES, API_BASE_URL, CARD_ROUTES, TRANSACTION_ROUTES, USER_ROUTES } from "../utils/constants";
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

export const addContact = async (contact: Contact) => {
  const headers = createAuthHeaders();
  console.log("headers:", headers);

  const response = await fetch(API_BASE_URL + USER_ROUTES.ADD_CONTACT, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(contact),
  });

  if (!response.ok) throw new Error("add contacts failed");
  const result = await response.json();
  console.log(`result ${result}`);
  return result;

}

export const getContacts = async () : Promise<Contact[]> => {
  const headers = createAuthHeaders();
  console.log("headers:", headers);

  const response = await fetch(API_BASE_URL + USER_ROUTES.GET_CONTACTS, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) throw new Error("fetch contacts failed");
  const result = await response.json();
  console.log(`result ${result}`);
  return result;

}

export const updateContacts = async (contacts:Contact[]) => {
  const headers = createAuthHeaders();
  console.log("headers:", headers);

  const response = await fetch(API_BASE_URL + USER_ROUTES.UPDATE_CONTACT, {
    method: "GET",
    headers: headers,
    body: JSON.stringify(contacts)
  });

  if (!response.ok) throw new Error("patch contacts failed");
  const result = await response.json();
  console.log(`result ${result}`);
  return result;

}
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


export const makeAccountTransfer = async (tx: TransactionRequest): Promise<StartTransactionResponse> => {
  const response = await fetch(`${API_BASE_URL}${TRANSACTION_ROUTES.MAKE_TRANSACTION}`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(tx),
  });
  const result = await response.json();
  console.log(`request transaction api response ${JSON.stringify(result)}`)
  if (!response.ok) throw new Error("start transaction failed");
  return result.data;


}
export const getTransactionHistory = async (
  accountNumber: string,
): Promise<TransactionHistory> => {
  const response = await fetch(
    `${API_BASE_URL}${TRANSACTION_ROUTES.TRANSACTION}/${accountNumber}${TRANSACTION_ROUTES.HISTORY}`,
    {
      method: 'GET',
      headers: createAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch transaction history');
  }

  const result = await response.json();

  // Debug logging
  console.log('Transaction history response:', result);

  // Handle nested response if backend wraps it
  const data = result.data || result;

  // Validate data structure
  if (!Array.isArray(data)) {
    console.error('Invalid transaction history format:', data);
    return [];
  }

  return data;
};

export const makePayment = async (paymentDto: any): Promise<StartTransactionResponse> => {
  const response = await fetch(`${API_BASE_URL}/payment`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(paymentDto),
  });
  const result = await response.json();
  console.log(`Payment API response: ${JSON.stringify(result)}`);
  if (!response.ok) {
    const errorMessage = result.message || 'Payment creation failed';
    throw new Error(errorMessage);
  }
  return result;
};




/**
 * 
 * ADMIN 
 *  
 */
export const updateAccountAdmin = async (dto: AccountAdminResponse): Promise<AccountAdminResponse> => {
  const response = await fetch(API_BASE_URL + ACCOUNT_ROUTES.UPDATE_ACCOUNT, {
    method: "PATCH",
    headers: createAuthHeaders(),
    body: JSON.stringify(dto),
  });
  if (!response.ok) throw new Error("updateAccount failed");
  const result = await response.json();
  return result;
};

export const getAllAccountsAdmin = async (): Promise<AccountAdminResponse[]> => {
  const response = await fetch(API_BASE_URL + ADMIN_ROUTES.FIND_ALL_ACCOUNTS, {
    method: "GET",
    headers: createAuthHeaders(),
  });
  if (!response.ok) throw new Error("getAllAccountsAdmin failed");
  return await response.json();
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/merchant/products`, {
    method: "GET",
    headers: createAuthHeaders(),
  });
  if (!response.ok) throw new Error("getProducts failed");
  return await response.json();
};

export const getMerchants = async (): Promise<Merchant[]> => {
  const response = await fetch(`${API_BASE_URL}/merchant/merchants`, {
    method: "GET",
    headers: createAuthHeaders(),
  });
  if (!response.ok) throw new Error("getMerchants failed");
  return await response.json();
};

export const getMerchant = async (name: string): Promise<Merchant> => {
  const response = await fetch(`${API_BASE_URL}/merchant/merchants/${name}`, {
    method: "GET",
    headers: createAuthHeaders(),
  });
  if (!response.ok) throw new Error("getMerchant failed");
  return await response.json();
};

