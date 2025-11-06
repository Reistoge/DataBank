import { useRef, useState, useEffect, type JSX } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiPlus,
  FiTrash2,
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiActivity,
  FiDollarSign,
  FiLock,
  FiSend,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiPlusCircle,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.hook';
import {
  getUserAccounts,
  getCards,
  updateCardSpentLimit,
  getTransactionHistory,
} from '../services/api.service';
import type {
  AccountResponse,
  CardResponse,
} from '../services/dto/account.types';
import type { User } from '../types/auth.types';
import { RESOURCES, ROUTES } from '../utils/constants';
import { tokenStorage } from '../utils/storage';
import { translate, userTranslations } from '../utils/translations';
import { colors, components } from '../utils/design-system';
import type {
  TransactionHistory,
  TransactionSnapshot,
} from '../types/transaction.types';

function Dashboard() {
  const { user, logout } = useAuth();
  const rotation = useRef(0);
  const [open, setOpen] = useState(false);
  const [showId, setShowId] = useState(false);

  // State management
  const [accountsData, setAccountsData] = useState<AccountResponse[]>([]);
  const [cardsData, setCardsData] = useState<CardResponse[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<AccountResponse | null>(null);
  const [transactionHistory, setTransactionHistory] =
    useState<TransactionHistory>([]);

  const [selectedCard, setSelectedCard] = useState<CardResponse>();
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Effects
  useEffect(() => {
    if (accountsData.length > 0 && selectedAccountIndex < accountsData.length) {
      setSelectedAccount(accountsData[selectedAccountIndex]);
    }
  }, [selectedAccountIndex, accountsData]);

  useEffect(() => {
    if (cardsData.length > 0 && selectedCardIndex < cardsData.length) {
      setSelectedCard(cardsData[selectedCardIndex]);
    }
  }, [selectedCardIndex, cardsData]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        const accounts = await getUserAccounts();
        setAccountsData(accounts);
        if (accounts.length > 0) {
          setSelectedAccount(accounts[0]);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load accounts');
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchCards = async () => {
      if (!selectedAccount) return;
      try {
        setIsLoadingCards(true);
        const cards = await getCards(selectedAccount.id);
        setCardsData(cards);
        setSelectedCardIndex(0);
      } catch (err) {
        setError('Failed to load cards');
        console.error(err);
      } finally {
        setIsLoadingCards(false);
      }
    };
    fetchCards();
  }, [selectedAccount]);
  // Fetch transaction history when selected account changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedAccount) return;

      try {
        setIsLoadingHistory(true);
        setError(null);
        const history = await getTransactionHistory(
          selectedAccount.accountNumber,
        );
        setTransactionHistory(history);
      } catch (err) {
        console.error('Failed to load transaction history:', err);
        setError('Failed to load transaction history');
        setTransactionHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedAccount]);
  const handleRotate = () => {
    const img = document.getElementById('dashboardLogo');
    if (img) {
      rotation.current += 360;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = 'transform 1s ease-in-out';
    }
  };

  const loadNextAccount = () => {
    setSelectedCardIndex(0);
    if (selectedAccountIndex + 1 >= accountsData.length) {
      setSelectedAccountIndex(0);
    } else {
      setSelectedAccountIndex(selectedAccountIndex + 1);
    }
  };

  const formatDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoDate;
    }
  };
  const refreshHistory = async () => {
    if (!selectedAccount) return;

    try {
      setIsLoadingHistory(true);
      const history = await getTransactionHistory(
        selectedAccount.accountNumber,
      );
      setTransactionHistory(history);
    } catch (err) {
      console.error('Failed to refresh history:', err);
      setError('Failed to refresh transaction history');
    } finally {
      setIsLoadingHistory(false);
    }
  };
  const formatDirection = (
    direction: string,
    accountNumber: string,
  ): {
    type: 'sent' | 'received';
    otherParty: string;
    icon: JSX.Element;
    colorClass: string;
  } => {
    if (direction.startsWith('OUT:')) {
      return {
        type: 'sent',
        otherParty: direction.replace('OUT: ', ''),
        icon: <FiTrendingDown className="text-red-500" />,
        colorClass: 'text-red-600',
      };
    } else {
      return {
        type: 'received',
        otherParty: direction.replace('GAIN: ', ''),
        icon: <FiTrendingUp className="text-green-500" />,
        colorClass: 'text-green-600',
      };
    }
  };
  // User Profile Component
  function UserProfileCard() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={components.card.primary}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiUser className="text-blue-600" />
            User Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user &&
            Object.entries(user)
              .filter(([key]) => key !== 'id')
              .map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <dt className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {translate<User>(key as keyof User, userTranslations)}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {key === 'roles' && Array.isArray(value)
                      ? value.join(', ')
                      : String(value)}
                  </dd>
                </div>
              ))}

          {/* Token Display */}
          <div className="col-span-full space-y-1">
            <dt className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Bearer Token
            </dt>
            <dd
              className="text-sm text-gray-700 break-all cursor-pointer hover:bg-gray-100 p-3 rounded-lg border transition-colors duration-200"
              onClick={() => {
                const token = tokenStorage.get();
                if (token) {
                  navigator.clipboard.writeText(token);
                  alert('Token copied to clipboard!');
                }
              }}
              title="Click to copy token"
            >
              ••••••••••••••••• (Click to copy)
            </dd>
          </div>
        </div>
      </motion.div>
    );
  }

  // Account Card Component
  function AccountCard() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={components.card.primary}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiCreditCard className="text-green-600" />
            Mi Cuenta
            {accountsData.length > 1 && (
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {selectedAccountIndex + 1} of {accountsData.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowId(!showId)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Toggle ID visibility"
            >
              {showId ? <FiEyeOff /> : <FiEye />}
            </button>
            {accountsData.length > 1 && (
              <button
                onClick={loadNextAccount}
                className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors"
                title="Next account"
              >
                <FiArrowRight />
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {isLoadingAccounts ? (
          <div className="text-center py-8">
            <FiRefreshCw className="animate-spin text-2xl text-blue-600 mx-auto mb-2" />
            <p className="text-gray-500">Loading accounts...</p>
          </div>
        ) : selectedAccount ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Numero de cuenta
              </dt>
              <dd className="text-xl font-bold text-gray-900">
                {showId ? selectedAccount.accountNumber : 'XXXXXXXXXXXXXXXXX'}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Cuenta
              </dt>
              <dd className="text-xl font-semibold text-blue-600">
                {selectedAccount.type}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Saldo
              </dt>
              <dd className="text-2xl font-bold text-green-600">
                ${selectedAccount.balance.toLocaleString()}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Sucursal Bancaria
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {selectedAccount.bankBranch}
              </dd>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FiCreditCard className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No accounts available</p>
            <Link
              to={ROUTES.ADD_ACCOUNT}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Create your first account
            </Link>
          </div>
        )}
      </motion.div>
    );
  }

  // Helper function to parse snapshot
  const parseSnapshot = (
    snapshotString: string,
  ): TransactionSnapshot | null => {
    try {
      return JSON.parse(snapshotString);
    } catch (error) {
      console.error('Failed to parse snapshot:', error);
      return null;
    }
  };

  function HistorySection() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={components.card.primary}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiClock className="text-orange-600" />
            Transaction History
            {selectedAccount && (
              <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {transactionHistory.length} transactions
              </span>
            )}
          </h2>
          <button
            className="p-2 text-orange-600 hover:text-orange-800 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={refreshHistory}
            title="Refresh history"
            disabled={isLoadingHistory || !selectedAccount}
          >
            <FiRefreshCw className={isLoadingHistory ? 'animate-spin' : ''} />
          </button>
        </div>

        {!selectedAccount ? (
          <div className="text-center py-12 text-gray-500">
            <FiCreditCard className="text-4xl mx-auto mb-2 opacity-50" />
            <p>Please select an account to view transaction history</p>
          </div>
        ) : isLoadingHistory ? (
          <div className="text-center py-12">
            <FiRefreshCw className="animate-spin text-3xl text-orange-600 mx-auto mb-2" />
            <p className="text-gray-500">Loading transaction history...</p>
          </div>
        ) : transactionHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiClock className="text-4xl mx-auto mb-2 opacity-50" />
            <p className="mb-2">No transactions yet</p>
            <Link
              to={ROUTES.TRANSFER}
              className="text-orange-600 hover:text-orange-800 underline"
            >
              Make your first transaction
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {transactionHistory.map((item, index) => {
              // Validate item structure
              if (!item?.tx || !item?.direction) {
                console.warn('Invalid transaction item:', item);
                return null;
              }

              const { tx, direction } = item;
              const {
                transactionId,
                status,
                createdAt,
                snapshot: snapshotString,
              } = tx;

              // Parse the snapshot JSON string
              const snapshot = parseSnapshot(snapshotString);

              if (!snapshot || !snapshot.request) {
                console.warn('Invalid snapshot data:', item);
                return null;
              }

              const { request, fraudResult } = snapshot;
              const {
                amount,
                type,
                merchantCategory,
                location,
                description,
                device,
                currency,
              } = request;

              const {
                type: directionType,
                otherParty,
                icon,
                colorClass,
              } = formatDirection(direction, selectedAccount.accountNumber);

              return (
                <motion.div
                  key={`${transactionId}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    {/* Left side - Transaction details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {icon}
                        <span className={`font-bold ${colorClass} text-lg`}>
                          {directionType === 'sent' ? '-' : '+'}$
                          {amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {status}
                        </span>
                        {fraudResult?.isFraud && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                            ⚠️ FRAUD
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <FiUser className="text-xs" />
                          <span className="font-medium">
                            {directionType === 'sent' ? 'To:' : 'From:'}
                          </span>
                          <span className="text-gray-900">{otherParty}</span>
                        </div>

                        <div className="flex items-center gap-1 text-gray-600">
                          <FiCalendar className="text-xs" />
                          <span>{formatDate(createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-1 text-gray-600">
                          <FiMapPin className="text-xs" />
                          <span>{location}</span>
                        </div>

                        <div className="flex items-center gap-1 text-gray-600">
                          <FiCreditCard className="text-xs" />
                          <span>{merchantCategory}</span>
                        </div>

                        <div className="flex items-center gap-1 text-gray-600">
                          <FiActivity className="text-xs" />
                          <span className="text-gray-900">{type}</span>
                        </div>

                        <div className="flex items-center gap-1 text-gray-600">
                          <FiDollarSign className="text-xs" />
                          <span>{currency}</span>
                        </div>

                        {device && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <FiSettings className="text-xs" />
                            <span>{device}</span>
                          </div>
                        )}

                        {fraudResult &&
                          fraudResult.probabilitySuspicious > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <FiLock className="text-xs" />
                              <span className="font-semibold">
                                Risk:{' '}
                                {(
                                  fraudResult.probabilitySuspicious * 100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          )}
                      </div>

                      {description && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{description}"
                        </p>
                      )}

                      {fraudResult &&
                        fraudResult.behaviours &&
                        fraudResult.behaviours.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                            <p className="text-xs text-red-600 font-semibold mb-1">
                              ⚠️ Suspicious Behaviours Detected:
                            </p>
                            <ul className="text-xs text-red-600 list-disc list-inside">
                              {fraudResult.behaviours.map((behaviour, idx) => (
                                <li key={idx}>
                                  {behaviour.description || behaviour.code}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>

                    {/* Right side - Transaction ID */}
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Transaction ID
                      </p>
                      <p className="text-xs font-mono text-gray-700 bg-white px-2 py-1 rounded border">
                        {transactionId.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {fraudResult?.recommendation && (
                          <span
                            className={`px-2 py-1 rounded ${
                              fraudResult.recommendation === 'APPROVE'
                                ? 'bg-green-100 text-green-700'
                                : fraudResult.recommendation === 'REVIEW'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {fraudResult.recommendation}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.gradients.primary}`}>
      {/* Navigation Bar */}
      <nav className={`${colors.gradients.card} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                id="dashboardLogo"
                onClick={handleRotate}
                className="w-10 h-10 rounded-full cursor-pointer hover:shadow-lg transition-all duration-200"
                src={RESOURCES.LOGO}
                alt="App Logo"
                title="Click to rotate!"
              />
              <h1 className="text-xl font-bold text-white">DataBank</h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4 relative">
              <span className="text-white flex items-center gap-2">
                <FiUser />
                Welcome, {user?.username}! 👋
              </span>

              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <FiSettings className="w-5 h-5" />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 py-2">
                    <Link
                      to={ROUTES.ADD_ACCOUNT}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      <FiPlusCircle />
                      Add Account
                    </Link>
                    <Link
                      to={ROUTES.ADD_CARD}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      <FiCreditCard />
                      Add Card
                    </Link>
                    <Link
                      to={ROUTES.TRANSFER}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      <FiDollarSign />
                      Transfer Money
                    </Link>
                    <Link
                      to={ROUTES.DELETE_ACCOUNT}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      <FiTrash2 />
                      Delete Account
                    </Link>
                    {user?.roles.includes('ADMIN') ? (
                      <Link
                        to={ROUTES.ADMIN_PANEL}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <FiLock /> Admin
                      </Link>
                    ) : (
                      <></>
                    )}
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <FiLogOut />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-500/20 border border-red-400 rounded-lg p-4 text-red-200">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-300 hover:text-red-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* First Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AccountCard />
          <UserProfileCard />
        </div>

        {/* Transaction History */}
        <div className="grid grid-cols-1 mt-6">
          <HistorySection />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6">
        <a
          href="https://github.com/Reistoge"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors duration-200"
        >
          @Ferran Rojas
        </a>
      </footer>
    </div>
  );
}

export default Dashboard;
