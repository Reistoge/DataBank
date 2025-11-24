import { motion } from 'framer-motion';
import { useState } from 'react';
import { FiSearch, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { getTransactionHistory, getAllAccountsAdmin, getAllUsersAdmin } from '../../services/api.service';
import { TransactionItem, type TransactionHistoryItem } from '../transaction-item.component';

type SearchType = 'ACCOUNT' | 'USER';

export function TransactionPanel() {
  const [searchType, setSearchType] = useState<SearchType>('ACCOUNT');
  const [searchValue, setSearchValue] = useState('');
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedAccount, setSearchedAccount] = useState<string>('');
  const [foundUserInfo, setFoundUserInfo] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchValue.trim()) return;

    setIsLoading(true);
    setError(null);
    setTransactions([]);
    setFoundUserInfo('');

    try {
      let targetAccountNumber = searchValue.trim();

      if (searchType === 'USER') {
        // 1. Fetch all users to find matches
        const allUsers = await getAllUsersAdmin();
        const searchLower = searchValue.toLowerCase();
        
        // Filter users by various attributes (Name, Email, RUT, ID)
        const matchingUsers = allUsers.filter(user => 
          user.username?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.rut?.toLowerCase().includes(searchLower) ||
          user.id === searchValue
        );

        if (matchingUsers.length === 0) {
          throw new Error(`No users found matching "${searchValue}"`);
        }

        // Get IDs of matching users
        const matchingUserIds = matchingUsers.map(u => u.id);

        // 2. Find accounts for these users
        const allAccounts = await getAllAccountsAdmin();
        
        // Filter accounts belonging to matching users
        const userAccounts = allAccounts.filter(
          acc => matchingUserIds.includes(acc.userId)
        );

        if (userAccounts.length === 0) {
          throw new Error('Found user(s) but they have no accounts');
        }

        // For simplicity, pick the first active account of the first matching user
        // In a future update, we could show a list of accounts to choose from
        const primaryAccount = userAccounts.find(acc => acc.isActive) || userAccounts[0];
        targetAccountNumber = primaryAccount.accountNumber;

        // Set info about the found user for display
        const foundUser = matchingUsers.find(u => u.id === primaryAccount.userId);
        if (foundUser) {
            setFoundUserInfo(`${foundUser.username} (${foundUser.email})`);
        }
      }

      setSearchedAccount(targetAccountNumber);
      const history = await getTransactionHistory(targetAccountNumber);
      setTransactions(history);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-5xl mx-auto p-6"
    >
      {/* Search Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FiSearch /> Transaction Search
        </h2>
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setSearchType('ACCOUNT')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchType === 'ACCOUNT' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              By Account
            </button>
            <button
              type="button"
              onClick={() => setSearchType('USER')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchType === 'USER' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              By User
            </button>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'ACCOUNT' ? "Enter Account Number..." : "Enter Username, Email, RUT or ID..."}
              className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !searchValue}
              className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
            </button>
          </div>
        </form>
      </div>

      {/* Results Area */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-200">
          <FiAlertCircle className="text-xl flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {searchedAccount && !isLoading && !error && (
        <div className="bg-white/90 rounded-xl p-6 shadow-xl min-h-[400px]">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
              <div className="text-sm text-gray-500">
                <p>Account: <span className="font-mono font-medium text-gray-700">{searchedAccount}</span></p>
                {foundUserInfo && (
                    <p className="mt-1 text-blue-600 font-medium">User: {foundUserInfo}</p>
                )}
              </div>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {transactions.length} Records
            </span>
          </div>

          <div className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((item, index) => (
                <TransactionItem
                  key={`${item.tx.transactionId}-${index}`}
                  item={item}
                  currentAccountNumber={searchedAccount}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No transactions found for this account.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}