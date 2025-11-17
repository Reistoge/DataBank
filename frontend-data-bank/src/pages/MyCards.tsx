import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCards,
  getUserAccounts,
  updateCardSpentLimit,
} from '../services/api.service';
import type {
  AccountResponse,
  CardResponse,
} from '../services/dto/account.types';
import { ANIMATION, RESOURCES, ROUTES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth.hook';
import { FiArrowLeft } from 'react-icons/fi';

function MyCards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rotation = useRef(0);

  // State
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [cards, setCards] = useState<CardResponse[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<AccountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullCard, setShowFullCard] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardForUpdate, setSelectedCardForUpdate] =
    useState<CardResponse | null>(null);
  const [newSpentLimit, setNewSpentLimit] = useState('');
  const [password, setPassword] = useState('');
  const [updateStatus, setUpdateStatus] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const result = await getUserAccounts();
        setAccounts(result || []);
        if (result && result.length > 0) {
          setSelectedAccount(result[0]);
        }
      } catch (err) {
        setError('Failed to fetch accounts.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch cards when selected account changes
  useEffect(() => {
    const fetchCards = async () => {
      if (!selectedAccount?.id) {
        setCards([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCards = await getCards(selectedAccount.id);
        setCards(fetchedCards || []);
      } catch (err) {
        setError('Failed to fetch cards for the selected account.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCards();
  }, [selectedAccount]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const account = accounts.find(
      (acc) => acc.accountNumber === e.target.value,
    );
    setSelectedAccount(account || null);
  };

  const handleOpenModal = (card: CardResponse) => {
    setSelectedCardForUpdate(card);
    setNewSpentLimit(String(card.spentLimit));
    setIsModalOpen(true);
    setUpdateStatus({ state: 'idle', message: '' });
    setPassword('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCardForUpdate(null);
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardForUpdate || !password || !newSpentLimit) {
      setUpdateStatus({ state: 'error', message: 'All fields are required.' });
      return;
    }

    setUpdateStatus({ state: 'loading', message: 'Updating...' });
    try {
      await updateCardSpentLimit(
        selectedCardForUpdate,
        parseFloat(newSpentLimit),
        password,
      );
      setUpdateStatus({
        state: 'success',
        message: 'Limit updated successfully!',
      });

      // Refresh cards
      if (selectedAccount) {
        const updatedCards = await getCards(selectedAccount.id);
        setCards(updatedCards);
      }

      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setUpdateStatus({
        state: 'error',
        message: `Update failed: ${errorMessage}`,
      });
      console.error(err);
    }
  };

  const handleToggleShowCard = (cardId: string) => {
    setShowFullCard((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleRotate = () => {
    const img = document.getElementById('appLogo');
    if (img) {
      rotation.current += ANIMATION.ROTATION_DEGREES;
      img.style.transform = `rotate(${rotation.current}deg)`;
    }
  };

  const UNLIMITED_THRESHOLD = 9007199254740000; // A large number to represent 'unlimited'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white p-4 sm:p-6 lg:p-8">
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      <header className="text-center my-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          My Cards
        </motion.h1>
        <p className="text-gray-400 mt-2">View and manage your cards.</p>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* Account Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 max-w-md mx-auto"
        >
          <label
            htmlFor="account-selector"
            className="block text-lg font-semibold mb-2"
          >
            Select Account
          </label>
          <select
            id="account-selector"
            value={selectedAccount?.accountNumber || ''}
            onChange={handleAccountChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            disabled={isLoading}
          >
            {accounts.length > 0 ? (
              accounts.map((acc) => (
                <option key={acc.id} value={acc.accountNumber}>
                  {acc.type} - {acc.accountNumber} (${acc.balance.toFixed(2)})
                </option>
              ))
            ) : (
              <option>No accounts found</option>
            )}
          </select>
        </motion.div>

        {/* Cards Display */}
        {isLoading && <p className="text-center">Loading cards...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}
        {!isLoading && !error && cards.length === 0 && (
          <p className="text-center text-gray-500">
            No cards found for this account.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-tr from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg border border-gray-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-mono">DataBank</span>
                  <img src={RESOURCES.LOGO} alt="logo" className="w-10 h-10" />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xl md:text-2xl font-mono tracking-wider">
                    {showFullCard[card.id]
                      ? card.number.replace(/(.{4})/g, '$1 ').trim()
                      : `**** **** **** ${card.number.slice(-4)}`}
                  </p>
                  <button
                    onClick={() => handleToggleShowCard(card.id)}
                    className="text-gray-400 hover:text-white transition"
                    title={
                      showFullCard[card.id] ? 'Hide number' : 'Show number'
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {showFullCard[card.id] ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-2.201-1.209A10.042 10.042 0 0112 19c-2.226 0-4.236-.9-5.657-2.343"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      )}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-between text-sm">
                  <p>
                    <span className="text-gray-500">CVV:</span> {card.cvv}
                  </p>
                  <p>
                    <span className="text-gray-500">Limit:</span>{' '}
                    {card.spentLimit > UNLIMITED_THRESHOLD
                      ? 'Unlimited'
                      : `$${card.spentLimit.toLocaleString()}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal(card)}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Modify Limit
              </button>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Update Modal */}
      {isModalOpen && selectedCardForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-8 w-full max-w-md m-4"
          >
            <h2 className="text-2xl font-bold mb-4">Update Spending Limit</h2>
            <p className="font-mono mb-6 text-gray-400">
              Card: **** {selectedCardForUpdate.number.slice(-4)}
            </p>
            <form onSubmit={handleUpdateLimit}>
              <div className="mb-4">
                <label
                  htmlFor="spentLimit"
                  className="block mb-2 font-semibold"
                >
                  New Limit ($)
                </label>
                <input
                  id="spentLimit"
                  type="number"
                  value={newSpentLimit}
                  onChange={(e) => setNewSpentLimit(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 5000"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block mb-2 font-semibold">
                  Card Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter card password to confirm"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatus.state === 'loading'}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  {updateStatus.state === 'loading'
                    ? 'Updating...'
                    : 'Confirm Update'}
                </button>
              </div>
            </form>
            {updateStatus.state !== 'idle' && (
              <p
                className={`mt-4 text-center text-sm ${
                  updateStatus.state === 'error'
                    ? 'text-red-400'
                    : updateStatus.state === 'success'
                      ? 'text-green-400'
                      : 'text-blue-400'
                }`}
              >
                {updateStatus.message}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default MyCards;
