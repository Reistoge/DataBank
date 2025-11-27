import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiCreditCard, FiArrowLeft, FiLock, FiCheckCircle, 
  FiXCircle, FiLoader, FiEye, FiEyeOff 
} from "react-icons/fi";
import displayAccountResponseComponent from "../components/display-account.component";
import displayCardResponseComponent from "../components/display-card.component";
import { useAuth } from "../hooks/useAuth.hook";
import { getUserAccounts, createCard } from "../services/api.service";
import type { AccountResponse, CardResponse } from "../services/dto/account.types";
import { ROUTES, ANIMATION, RESOURCES } from "../utils/constants";
import { colors, components } from "../utils/design-system";

function AddCard() {
  type FormDeleteState = 'form' | 'submit' | 'success' | 'error';

  const [formData, setFormData] = useState({
    accountNumber: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse>();
  const [creationState, setFormState] = useState<FormDeleteState>('form');
  const [createdCard, setCreatedCard] = useState<CardResponse>();
  const navigate = useNavigate();
  const rotation = useRef(0);
  const [creationError, setCreationError] = useState<Error>();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await getUserAccounts();
        setAccounts(result || []);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!accounts || !formData.accountNumber) return;
    const selectedAccount = accounts.find(
      (account) => account.accountNumber === formData.accountNumber,
    );
    setSelectedAccount(selectedAccount);
  }, [formData.accountNumber, accounts]);

  const handleRotate = () => {
    const img = document.getElementById('appLogo');
    if (img) {
      rotation.current += ANIMATION.ROTATION_DEGREES;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = `transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount?.id) {
      setFormState('error');
      setCreationError(new Error('No account selected'));
      return;
    }

    if (!formData.password) {
      setFormState('error');
      setCreationError(new Error('Password is required'));
      return;
    }

    setFormState('submit');

    try {
      const response = await createCard({
        accountId: selectedAccount.id,
        password: formData.password,
        accountNumber: selectedAccount.accountNumber
      });

      setCreatedCard(response);
      setFormData({ accountNumber: '', password: '' });
      setFormState('success');
    } catch (err) {
      setFormState('error');
      setCreationError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Success Display Component
  function SuccessDisplay() {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${components.card.gradient} text-center`}
      >
        <div className="flex items-center justify-center mb-4">
          <FiCheckCircle className="text-4xl text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Card Created Successfully!</h2>
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
  function ErrorDisplay() {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-500/20 border border-red-400 rounded-xl p-6 text-center backdrop-blur-sm"
      >
        <div className="flex items-center justify-center mb-4">
          <FiXCircle className="text-4xl text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-red-200 mb-2">Error Creating Card</h2>
        <p className="text-red-300 mb-4">{creationError?.message || 'An unknown error occurred'}</p>
        <button
          onClick={() => setFormState('form')}
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
          <FiLoader className="text-4xl text-blue-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Creating Card...</h2>
        <p className="text-gray-300">Please wait while we process your request</p>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.gradients.primary} flex flex-col`}>
      {/* Back Button */}
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
        {/* Main Content */}
        {creationState === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <form onSubmit={handleSubmit}>
              <div className={`${colors.gradients.card} rounded-2xl p-8 shadow-2xl`}>
                {/* Logo Section */}
                <div className="text-center mb-8">
                  <img
                    id="appLogo"
                    onClick={handleRotate}
                    className="w-25 h-20 mx-auto rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 mb-4"
                    src={RESOURCES.LOGO}
                    alt="App Logo"
                    title="Click to rotate!"
                  />
                  <h1 className="text-2xl font-bold text-white mb-2">Create New Card</h1>
                  <p className="text-white/80">Add a card to your account</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  {/* Account Selector */}
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                      <FiCreditCard />
                      Select Account
                    </label>
                    <select
                      className={components.input.primary}
                      value={formData.accountNumber}
                      onChange={handleChange}
                      name="accountNumber"
                      required
                    >
                      <option value="">Choose an account...</option>
                      {accounts.length > 0 ? (
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

                  {/* Password Input */}
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                      <FiLock />
                      Card Password
                    </label>
                    <div className="relative">
                      <input
                        className={`${components.input.primary} pr-10`}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter account password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    className={`${components.button.primary} w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    type="submit"
                    disabled={creationState.toString() === 'submit' || !selectedAccount}
                  >
                    <FiCreditCard />
                    Create Card
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* State-based displays */}
        {creationState === 'submit' && (
          <div className="w-full max-w-md">
            <LoadingDisplay />
          </div>
        )}

        {creationState === 'success' && (
          <div className="w-full max-w-md">
            <SuccessDisplay />
          </div>
        )}

        {creationState === 'error' && (
          <div className="w-full max-w-md">
            <ErrorDisplay />
          </div>
        )}

        {/* Account & Card Display */}
        {(selectedAccount || createdCard) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-6xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 px-4"
          >
            {/* Selected Account */}
            {selectedAccount && (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className={components.card.primary}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-500 flex items-center gap-2">
                  <FiCreditCard className="text-blue-600" />
                  Selected Account
                </h2>
                {displayAccountResponseComponent(
                  selectedAccount,
                  'space-y-4',
                  'text-sm font-semibold text-gray-600 uppercase tracking-wide',
                  'text-lg font-bold text-gray-900',
                )}
              </motion.div>
            )}

            {/* New Card */}
            {createdCard && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-br from-green-400 via-emerald-500 to-blue-600 rounded-xl shadow-2xl p-6 h-fit text-white"
              >
                <h2 className="text-2xl font-bold mb-6 pb-4 border-b-2 border-white opacity-90 flex items-center gap-2">
                  <FiCheckCircle />
                  New Card Created!
                </h2>
                {displayCardResponseComponent(
                  createdCard,
                  'space-y-4',
                  'text-sm font-semibold text-white opacity-80 uppercase tracking-wide',
                  'text-lg font-bold text-white',
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

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

export default AddCard;
