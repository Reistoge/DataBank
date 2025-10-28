import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import displayCardResponseComponent from "../components/display-card.component";
import { useAuth } from "../hooks/useAuth.hook";
import { getUserAccounts, getCards, deleteCard } from "../services/api.service";
import type { AccountResponse, CardResponse } from "../services/dto/account.types";
import { ANIMATION, RESOURCES, ROUTES } from "../utils/constants";

 
function DeleteCard() {
  type FormState = 'form' | 'submit' | 'success' | 'error';

  const [formData, setFormData] = useState({
    accountNumber: '',
    cardId: '',
    password: '',
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [cards, setCards] = useState<CardResponse[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);
  const [formState, setFormState] = useState<FormState>('form');
  const [error, setError] = useState<Error | null>(null);

  const rotation = useRef(0);

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await getUserAccounts();
        setAccounts(result || []);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setAccounts([]);
      }
    };
    fetchAccounts();
  }, []);

  // Update selected account when accountNumber changes
  useEffect(() => {
    if (!formData.accountNumber) {
      setSelectedAccount(null);
      setCards([]);
      setSelectedCard(null);
      return;
    }

    const selected = accounts.find(
      (account) => account.accountNumber === formData.accountNumber
    );
    setSelectedAccount(selected || null);
  }, [formData.accountNumber, accounts]);

  // Fetch cards when selected account changes
  useEffect(() => {
    const fetchCards = async () => {
      if (!selectedAccount?.id) {
        setCards([]);
        setSelectedCard(null);
        return;
      }

      try {
        const fetchedCards = await getCards(selectedAccount.id);
        setCards(fetchedCards || []);
        if (fetchedCards && fetchedCards.length > 0) {
          setSelectedCard(fetchedCards[0]);
          setFormData((prev) => ({ ...prev, cardId: fetchedCards[0].id }));
        } else {
          setSelectedCard(null);
        }
      } catch (err) {
        console.error('Failed to fetch cards:', err);
        setCards([]);
        setSelectedCard(null);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update selected card when cardId changes
    if (name === 'cardId') {
      const selected = cards.find((card) => card.id === value);
      setSelectedCard(selected || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCard?.id) {
      setFormState('error');
      setError(new Error('No card selected'));
      return;
    }

    const formElement = e.currentTarget;
    const f = new FormData(formElement);
    const password = (f.get('password') as string) || '';

    if (!password) {
      setFormState('error');
      setError(new Error('Password is required'));
      return;
    }

    setFormState('submit');
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await deleteCard(selectedCard.id, password);

      // Refresh cards after deletion
      if (selectedAccount) {
        const updatedCards = await getCards(selectedAccount.id);
        setCards(updatedCards || []);
        setSelectedCard(null);
        setFormData((prev) => ({
          ...prev,
          cardId: '',
          password: '',
        }));
      }

      setFormState('success');
    } catch (err) {
      setFormState('error');
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  function AccountIdPicker() {
    return (
      <div className="w-full">
        <label
          htmlFor="accountNumber"
          className="block text-white font-semibold mb-2"
        >
          Select Account
        </label>
        <select
          id="accountNumber"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleChange}
          className="w-full rounded p-3 bg-white text-black font-semibold border-2 border-transparent hover:border-gray-300 focus:outline-none focus:border-white transition-all"
        >
          <option value="">Choose an account...</option>
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <option key={account.id} value={account.accountNumber}>
                {account.accountNumber} - {account.type} (${account.balance})
              </option>
            ))
          ) : (
            <option disabled>No accounts available</option>
          )}
        </select>
      </div>
    );
  }

  function CardIdPicker() {
    return (
      <div className="w-full">
        <label htmlFor="cardId" className="block text-white font-semibold mb-2">
          Select Card
        </label>
        <select
          id="cardId"
          name="cardId"
          value={formData.cardId}
          onChange={handleChange}
          className="w-full rounded p-3 bg-white text-black font-semibold border-2 border-transparent hover:border-gray-300 focus:outline-none focus:border-white transition-all"
          disabled={cards.length === 0}
        >
          <option value="">Choose a card...</option>
          {cards.length > 0 ? (
            cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.number.slice(-4).padStart(card.number.length, '*')} (CVV: {card.cvv})
              </option>
            ))
          ) : (
            <option disabled>No cards available</option>
          )}
        </select>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <form onSubmit={handleSubmit} className="flex flex-row justify-center">
            <div className="flex flex-col items-center gap-6 bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 rounded-2xl p-8 shadow-2xl w-full max-w-sm">
              {/* Rotating Logo */}
              <img
                id="appLogo"
                onClick={handleRotate}
                className="w-20 h-20 rounded-xl cursor-pointer hover:shadow-lg transition-shadow duration-200"
                src={RESOURCES.LOGO}
                alt="App Logo"
                title="Click to rotate!"
              />

              {/* Account Selector */}
              {AccountIdPicker()}

              {/* Card Selector */}
              {selectedAccount && CardIdPicker()}

              {/* Password Input */}
              <div className="w-full">
                <label
                  htmlFor="password"
                  className="block text-white font-semibold mb-2"
                >
                  Card Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded p-2 bg-white text-black font-semibold border-2 hover:border-gray-400 transition-all focus:outline-none focus:border-white"
                  placeholder="Enter card password"
                />
              </div>

              {/* Submit Button */}
              <button
                className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-400 text-black font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={formState === 'submit' || !selectedCard}
              >
                {formState === 'submit' ? 'Deleting...' : 'Delete Card'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Selected Card Display */}
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-full max-w-md mt-8"
          >
            <div className="bg-white rounded-xl shadow-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Card to Delete</h2>
              {displayCardResponseComponent(
                selectedCard,
                'space-y-3',
                'text-sm font-semibold text-gray-600',
                'text-lg font-bold text-gray-900'
              )}
            </div>
          </motion.div>
        )}

        {/* Response Messages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md mt-8 px-4"
        >
          {formState === 'submit' && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
              <p className="font-semibold">Deleting card...</p>
            </div>
          )}

          {formState === 'error' && error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error.message}</p>
            </div>
          )}

          {formState === 'success' && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
              <p className="font-semibold">Success!</p>
              <p className="text-sm mb-3">Card deleted successfully</p>
              <button
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-gray-700">
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

export default DeleteCard;