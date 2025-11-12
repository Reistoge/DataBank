import { motion } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.hook';
import { createAccount, getAllAccountsAdmin, deleteAccount, updateAccount, updateAccountAdmin } from '../services/api.service';
import {
  type AccountResponse,
  type CreateAccountDto,
  type AccountAdminResponse,
  AccountType,
} from '../services/dto/account.types';
import { ANIMATION } from '../utils/constants';
import {
  displayAllAccountResponseComponentInput,
  displayAllAccountResponseComponentInputAdmin,
} from '../components/display-account.component';



function AdminPanel() {
 
  //  State for accounts management
  const [allAccounts, setAllAccounts] = useState<AccountAdminResponse[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AccountAdminResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const accountsPerPage = 10;

 

 
  const navigate = useNavigate();
  

  //  Fetch accounts on component mount
  useEffect(() => {
    fetchAllAccounts();
  }, []);

  //  Filter accounts when search term changes
  useEffect(() => {
    const filtered = allAccounts.filter(accountAdmin => {
      const account = accountAdmin;
      return (
        account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.bankBranch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredAccounts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, allAccounts]);

  //  Fetch all accounts function
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

  //  Pagination calculations
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);
  const startIndex = (currentPage - 1) * accountsPerPage;
  const endIndex = startIndex + accountsPerPage;
  const currentAccounts = filteredAccounts.slice(startIndex, endIndex);

  //  Handle account deletion
  const handleDeleteAccount = async (account: AccountAdminResponse) => {
    if (!confirm(`Are you sure you want to delete account ${account.accountNumber}?`)) {
      return;
    }

    try {
      await deleteAccount(account.id);
      // Refresh accounts list
      await fetchAllAccounts();
      alert('Account deleted successfully');
    } catch (err) {
      alert(`Failed to delete account: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Delete error:', err);
    }
  };

  // Handle account update
  const handleUpdateAccount = async (account: AccountAdminResponse) => {
    try {
       console.log('Update account:', account);
       
     
      const results =await updateAccountAdmin(account);
      await fetchAllAccounts();
      alert('Account updated successfully');
    } catch (err) {
      alert(`Failed to update account: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Update error:', err);
    }
  };

  //  Create AccountRow component
  interface AccountRowProps {
    accountAdmin: AccountAdminResponse;
    onDelete?: (account: AccountAdminResponse) => void;
    onUpdate?: (account: AccountAdminResponse) => void;
  }

  function AccountRow({ accountAdmin, onDelete, onUpdate }: AccountRowProps) {
    const [temp, setTemp] = useState<AccountAdminResponse>(accountAdmin);

    const handleReset = () => {
      setTemp({ ...accountAdmin });
    };

     
    const handleValueChange = (key: string, value: any) => {
      setTemp((prev) => ({
        ...prev,
        [key]: value   
      }));
    };

    return (
      <div className="group bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all duration-200">
        {/*  Account Info Display */}
        <div className="mb-2">
          <div className="text-xs text-gray-300 mb-1">
            Created: {`${new Date(accountAdmin.createdAt).toLocaleDateString() } `}
          </div>
          {displayAllAccountResponseComponentInputAdmin(
            temp,
            '',
            'text-xs font-bold text-gray-400 uppercase tracking-wide',
            'text-sm font-semibold text-gray-900 rounded p-1 bg-white/90',
            'gap-2 grid grid-cols-2',
            handleValueChange,
          )}
        </div>


        {/*  Action Buttons */}
        <div className="grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-md p-2 shadow-sm transition-colors"
            onClick={() => onDelete?.(temp)}
          >
            Eliminar
          </button>
          <button
            type="button"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md p-2 shadow-sm transition-colors"
            onClick={() => onUpdate?.(temp)}
          >
            Actualizar
          </button>
          <button
            type="button"
            className="text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-md p-2 shadow-sm transition-colors"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  //  Pagination Component
  function Pagination() {
    return (
      <div className="flex items-center justify-between mt-4 p-4 bg-white/10 rounded-lg">
        <div className="text-sm text-gray-300">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredAccounts.length)} of {filteredAccounts.length} accounts
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex flex-col">
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
      
      <div className="flex flex-col items-center justify-start flex-1 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-7xl p-6"
        >
          {/*  Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-300">Manage all user accounts</p>
          </div>

          {/*  Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                id="searchInput"
                type="text"
                placeholder="Search by account number, branch, type, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 border border-white/20 focus:border-blue-500 focus:outline-none"
              />
              <div className="absolute left-3 top-3 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {/*  Refresh Button */}
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={fetchAllAccounts}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors"
            >
              {isLoading ? 'Loading...' : 'Refresh Accounts'}
            </button>
            
            <div className="text-gray-300">
              Total: {allAccounts.length} accounts
            </div>
          </div>

          {/*  Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
              Error: {error}
            </div>
          )}

          {/*  Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="text-white">Loading accounts...</div>
            </div>
          )}

          {/*  Accounts Grid */}
          {!isLoading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
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
                  <div className="col-span-full text-center py-8 text-gray-400">
                    {searchTerm ? 'No accounts found matching your search.' : 'No accounts available.'}
                  </div>
                )}
              </div>

              {/*  Pagination */}
              {filteredAccounts.length > accountsPerPage && <Pagination />}
            </>
          )}
        </motion.div>
      </div>

      <footer className="text-center py-4">
        <a
          href="https://github.com/Reistoge"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          @Ferran Rojas
        </a>
      </footer>
    </div>
  );
}

export default AdminPanel;
