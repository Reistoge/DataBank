import { AccountAdminResponse } from '../services/dto/account.types';

export type AdminView = 'ACCOUNTS' | 'TRANSACTIONS' | 'LOGS';

export interface AccountRowProps {
  accountAdmin: AccountAdminResponse;
  onDelete?: (account: AccountAdminResponse) => void;
  onUpdate?: (account: AccountAdminResponse) => void;
}