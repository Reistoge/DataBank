import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTrash2,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiCreditCard,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth.hook';
import {
  getUserAccounts,
  getCards,
  deleteAccount,
} from '../services/api.service';
import type {
  AccountResponse,
  CardResponse,
} from '../services/dto/account.types';
import { ROUTES, ANIMATION, RESOURCES } from '../utils/constants';
import { colors, components } from '../utils/design-system';

type FormDeleteState = 'form' | 'submit' | 'success' | 'error';

// Success Display Component
function SuccessDisplay({ navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${components.card.gradient} text-center`}
    >
      <div className="flex items-center justify-center mb-4">
        <FiCheckCircle className="text-6xl text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">
        Account Deleted Successfully
      </h2>
      <p className="text-gray-300 mb-6">
        The account has been permanently removed from your profile.
      </p>
      <button
        onClick={() => navigate(ROUTES.DASHBOARD)}
        className={`${components.button.primary} w-full`}
      >
        Go to Dashboard
      </button>
    </motion.div>
  );
}

// Error Display Component
function ErrorDisplay({ error, setDeletionState }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-red-500/20 border border-red-400 rounded-xl p-6 text-center backdrop-blur-sm"
    >
      <div className="flex items-center justify-center mb-4">
        <FiXCircle className="text-6xl text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-red-200 mb-2">
        Deletion Failed
      </h2>
      <p className="text-red-300 mb-4">
        {error?.message || 'An unknown error occurred'}
      </p>
      <button
        onClick={() => setDeletionState('form')}
        className={`${components.button.secondary} w-full`}
      >
        Try Again
      </button>
    </motion.div>
  );
}

// Loading Display Component
function LoadingDisplay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${components.card.gradient} text-center`}
    >
      <div className="flex items-center justify-center mb-4">
        <FiLoader className="text-6xl text-blue-400 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Deleting Account...</h2>
      <p className="text-gray-300">
        Please wait while we process your request.
      </p>
    </motion.div>
  );
}

function DeleteAccount() {
  const [accountNumber, setAccountNumber] = useState('');
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse>();
  const [cards, setCards] = useState<CardResponse[]>();
  const [deletionState, setDeletionState] = useState<FormDeleteState>('form');
  const navigate = useNavigate();
  const rotation = useRef(0);
  const [deletionError, setDeletionError] = useState<Error>();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await getUserAccounts();
        setAccounts(result || []);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setDeletionError(new Error('Failed to load accounts.'));
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!accounts || !accountNumber) {
      setSelectedAccount(undefined);
      setCards([]);
      return;
    }
    const account = accounts.find((acc) => acc.accountNumber === accountNumber);
    setSelectedAccount(account);
  }, [accountNumber, accounts]);

  useEffect(() => {
    const fetchCards = async () => {
      if (!selectedAccount?.id) {
        setCards([]);
        return;
      }
      try {
        const fetchedCards = await getCards(selectedAccount.id);
        setCards(fetchedCards);
      } catch (err) {
        console.error('Failed to fetch cards:', err);
        setCards([]);
      }
    };
    fetchCards();
  }, [selectedAccount]);

  const handleRotate = () => {
    const img = document.getElementById('appLogo');
    if (img) {
      rotation.current += ANIMATION.ROTATION_DEGREES;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = `transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAccountNumber(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount?.id) {
      setDeletionState('error');
      setDeletionError(new Error('Please select a valid account to delete.'));
      return;
    }
    setDeletionState('submit');
    try {
      await deleteAccount(selectedAccount.id);
      setDeletionState('success');
    } catch (err) {
      setDeletionState('error');
      setDeletionError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <div className={`min-h-screen ${colors.gradients.primary} flex flex-col`}>
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        {deletionState === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <form onSubmit={handleSubmit}>
              <div className={`${components.card.gradient} p-8`}>
                <div className="text-center mb-8">
                  <img
                    id="appLogo"
                    onClick={handleRotate}
                    className="w-25 h-20 mx-auto rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 mb-4"
                    src={RESOURCES.LOGO_B}
                    alt="App Logo"
                    title="Click to rotate!"
                  />
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Delete Account
                  </h1>
                  <p className="text-white/80">
                    Permanently remove an account from your profile.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                      <FiCreditCard />
                      Select Account to Delete
                    </label>
                    <select
                      className={components.input.primary}
                      value={accountNumber}
                      onChange={handleChange}
                      name="accountNumber"
                      required
                    >
                      <option value="">Select an account...</option>
                      {accounts.map((account) => (
                        <option
                          key={account.accountNumber}
                          value={account.accountNumber}
                        >
                          {account.accountNumber} - {account.type} ($
                          {account.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAccount && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-white/10 rounded-lg p-4"
                    >
                      <h3 className="text-white font-semibold mb-2">
                        Associated Cards
                      </h3>
                      {cards && cards.length > 0 ? (
                        <ul className="space-y-1 text-sm text-gray-300">
                          {cards.map((card) => (
                            <li key={card.id} className="flex items-center gap-2">
                              <FiCreditCard />
                              <span>**** **** **** {card.number.slice(-4)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No cards associated with this account.
                        </p>
                      )}
                    </motion.div>
                  )}

                  <button
                    className={`${components.button.danger} w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    type="submit"
                    disabled={!accountNumber || deletionState === 'submit'}
                  >
                    <FiTrash2 />
                    Delete Account
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {deletionState === 'submit' && (
          <div className="w-full max-w-md">
            <LoadingDisplay />
          </div>
        )}
        {deletionState === 'success' && (
          <div className="w-full max-w-md">
            <SuccessDisplay navigate={navigate} />
          </div>
        )}
        {deletionState === 'error' && (
          <div className="w-full max-w-md">
            <ErrorDisplay
              error={deletionError}
              setDeletionState={setDeletionState}
            />
          </div>
        )}
      </div>

      <footer className="text-center py-6">
        <a
          href="https://github.com/Reistoge/DataBank"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors duration-200"
        >
          @DataBank
        </a>
      </footer>
    </div>
  );
}

export default DeleteAccount;
