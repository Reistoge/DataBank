import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import displayAccountResponseComponent from "../components/display-account.component";
import displayCardResponseComponent from "../components/display-card.component";
import { useAuth } from "../hooks/useAuth.hook";
import { getUserAccounts, createCard } from "../services/api.service";
import type { AccountResponse, CardResponse } from "../services/dto/account.types";
import { ROUTES, ANIMATION, RESOURCES } from "../utils/constants";

 
function AddCard() {
  type FormDeleteState = 'form' | 'submit' | 'success' | 'error';

  const [formData, setFormData] = useState({
    accountNumber: '',
    password: '',
  });

  const { user } = useAuth();

  const [accounts, setAccounts] = useState<AccountResponse[]>();
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse>();
  const [cards, setCards] = useState<CardResponse[]>();
  const [creationState, setFormState] = useState<FormDeleteState>('form');
  const [createdCard, setCreatedCard] = useState<CardResponse>();

  const navigate = useNavigate();

  const rotation = useRef(0);

  const [creationError, setCreationError] = useState<Error>();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await getUserAccounts();
        setAccounts(result);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };

    fetchAccounts();
  }, []); // Only run once on mount

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await getUserAccounts();
        setAccounts(result);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };

    fetchAccounts();
  }, [creationState]); // Only run once on mount

  useEffect(() => {
    if (!accounts || !formData.accountNumber) return;

    const selectedAccount = accounts.find(
      (account) => account.accountNumber === formData.accountNumber, // Fixed comparison
    );

    setSelectedAccount(selectedAccount);
  }, [formData.accountNumber, accounts]); // Only depend on what you actually use

  useEffect(() => {
    setCreatedCard(undefined);
  }, [selectedAccount]); // Fetch cards when selected account changes

  function showFormSubmitLoad() {
    return (
      <>
        <div className="w-16">
          <img src="public/loading-gif-3262986532.gif" alt="" />
        </div>
      </>
    );
  }
  function displaySuccess() {
    return (
      <div className="text-green-600 bg-green-50 p-4 rounded-lg">
        <p className="font-semibold">Success!</p>
        <p>Card created successfully</p>
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  function displayError() {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-lg">
        <p className="font-semibold">Error:</p>
        <p>{creationError?.message || 'An unknown error occurred'}</p>
      </div>
    );
  }

  function displayDoingForm() {
    return <></>;
  }
  function handleAddCardResponse() {
    switch (creationState) {
      case 'form':
        return displayDoingForm();
      case 'submit':
        return showFormSubmitLoad();
      case 'success':
        return displaySuccess(); // Added success display
      case 'error':
        return displayError();
      default:
        return null;
    }
  }
  const handleRotate = () => {
    const img = document.getElementById('appLogo');
    if (img) {
      rotation.current += ANIMATION.ROTATION_DEGREES;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = `transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`;
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formElement = e.currentTarget as HTMLFormElement;
    const f = new FormData(formElement);
    const entries = Object.fromEntries(f);

    // Extract password directly from FormData
    const password = entries.password as string;

    console.log('Form Data:', {
      accountNumber: formData.accountNumber,
      password: password,
    });

    if (!selectedAccount?.id) {
      setFormState('error');
      setCreationError(new Error('No account selected'));
      return;
    }

    if (!password) {
      setFormState('error');
      setCreationError(new Error('Password is required'));
      return;
    }

    setFormState('submit');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      // Use the password variable directly, not formData.password
      const response = await createCard({
        accountId: selectedAccount.id,
        password: password, // Use the extracted password
      });

      console.log('Card Response:', response);
      setCreatedCard(response);

      // Now update formData for display purposes if needed
      setFormData({
        accountNumber: '',
        password: '',
      });

      setFormState('success');
    } catch (err) {
      setFormState('error');
      setCreationError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  function AccountIdPicker() {
    return (
      <div className="w-full">
        <div className="fixed top-4 left-4 z-50">
          <img 
            id="go_back"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="w-8 h-8 cursor-pointer hover:shadow-lg hover:scale-105 transition-transform duration-200"
            src="../public/go-back.png"
            alt="go_back"
            title="Click to return"
          />
        </div>    
        <label
          htmlFor="AccountIdPicker"
          className="block text-white font-semibold mb-2"
        >
          Select Account
        </label>
        <select
          className="w-full rounded p-3 bg-white text-black font-semibold border-2 border-transparent hover:border-gray-300 focus:outline-none focus:border-white transition-all"
          value={formData.accountNumber}
          onChange={handleChange}
          name="accountNumber"
          id="AccountIdPicker"
        >
          <option value="">Choose an account...</option>
          {accounts && accounts.length > 0 ? (
            accounts.map((account) => (
              <option key={account.accountNumber} value={account.accountNumber}>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Form Section - Fixed Position */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <form
            id="add-card-form"
            onSubmit={handleSubmit}
            className="flex flex-row justify-center"
          >
            <div className="flex flex-col items-center gap-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 shadow-2xl w-full max-w-sm">
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

              {/* Password Input */}
              <div className="w-full">
                <label
                  className="block text-white font-semibold mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="w-full rounded p-2 bg-white text-black font-semibold border-2 hover:border-gray-400 transition-all focus:outline-none focus:border-white"
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Enter password"
                />
              </div>

              {/* Submit Button */}
              <button
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={creationState === 'submit'}
              >
                {creationState === 'submit' ? 'Creating...' : 'Create Card'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Account & Card Display - Below Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-6xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 px-4"
        >
          {/* Selected Account - Left */}
          {selectedAccount && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl shadow-2xl p-6 h-fit"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-500">
                📋 Selected Account
              </h2>
              {displayAccountResponseComponent(
                selectedAccount,
                'space-y-4',
                'text-sm font-semibold text-gray-600 uppercase tracking-wide',
                'text-lg font-bold text-gray-900',
              )}
            </motion.div>
          )}

          {/* New Card - Right */}
          {createdCard ? (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-green-400 via-emerald-500 to-blue-600 rounded-xl shadow-2xl p-6 h-fit text-white"
            >
              <h2 className="text-2xl font-bold mb-6 pb-4 border-b-2 border-white opacity-90">
                ✨ New Card Created!
              </h2>
              {displayCardResponseComponent(
                createdCard,
                'space-y-4',
                'text-sm font-semibold text-white opacity-80 uppercase tracking-wide',
                'text-lg font-bold text-white',
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-gray-800 rounded-xl shadow-2xl p-6 h-fit flex items-center justify-center min-h-48"
            >
              <p className="text-gray-400 text-lg text-center">
                Create a card to see it here ✨
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Response Messages */}
        {handleAddCardResponse() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mt-8 px-4"
          >
            {handleAddCardResponse()}
          </motion.div>
        )}
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
export default AddCard;
