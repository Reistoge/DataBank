import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getAllAccountsAdmin, deleteAccount, updateAccountAdmin } from '../../services/api.service';
import type { AccountAdminResponse } from '../../services/dto/account.types';
import { AccountRow } from './account-row.component';
 
export function AccountPanel() {
  // State for accounts management
  const [allAccounts, setAllAccounts] = useState<AccountAdminResponse[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AccountAdminResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountsPerPage = 10;

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAllAccounts();
  }, []);

  // Filter accounts when search term changes
  useEffect(() => {
    const filtered = allAccounts.filter((accountAdmin) => {
      return (
        accountAdmin.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accountAdmin.bankBranch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accountAdmin.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accountAdmin.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredAccounts(filtered);
    setCurrentPage(1);
  }, [searchTerm, allAccounts]);

  const fetchAllAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await getAllAccountsAdmin();
      setAllAccounts(accounts);
      setFilteredAccounts(accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (account: AccountAdminResponse) => {
    if (!confirm(`Are you sure you want to delete account ${account.accountNumber}?`)) {
      return;
    }
    try {
      await deleteAccount(account.id);
      await fetchAllAccounts();
      alert('Account deleted successfully');
    } catch (err) {
      alert(`Failed to delete account: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateAccount = async (account: AccountAdminResponse) => {
    try {
      await updateAccountAdmin(account);
      await fetchAllAccounts();
      alert('Account updated successfully');
    } catch (err) {
      alert(`Failed to update account: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);
  const startIndex = (currentPage - 1) * accountsPerPage;
  const endIndex = startIndex + accountsPerPage;
  const currentAccounts = filteredAccounts.slice(startIndex, endIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-7xl mx-auto p-6"
    >
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 border border-white/20 focus:border-blue-500 focus:outline-none"
          />
          <div className="absolute left-3 top-3 text-gray-400">🔍</div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">
            Total: {allAccounts.length}
          </span>
          <button
            onClick={fetchAllAccounts}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center gap-2"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div className="text-white mt-2">Loading accounts...</div>
        </div>
      )}

      {/* Accounts Grid */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {currentAccounts.length > 0 ? (
              currentAccounts.map((accountAdmin) => (
                <AccountRow
                  key={accountAdmin.id}
                  accountAdmin={accountAdmin}
                  onDelete={handleDeleteAccount}
                  onUpdate={handleUpdateAccount}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400">
                  {searchTerm ? 'No accounts found matching your search.' : 'No accounts available.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredAccounts.length > accountsPerPage && (
            <div className="flex items-center justify-between mt-4 p-4 bg-white/10 rounded-lg">
              <div className="text-sm text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAccounts.length)} of {filteredAccounts.length}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-white bg-gray-700 rounded">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}