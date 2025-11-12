import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSend,
  FiArrowLeft,
  FiLock,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiDollarSign,
  FiUser,
  FiMail,
  FiMapPin,
  FiCreditCard,
  FiInfo,
} from 'react-icons/fi';
import displayAccountResponseComponent from '../components/display-account.component';
import { useAuth } from '../hooks/useAuth.hook';
import { getUserAccounts, transaction } from '../services/api.service';
import type { AccountResponse } from '../services/dto/account.types';
import { ROUTES, ANIMATION, RESOURCES } from '../utils/constants';
import { colors, components } from '../utils/design-system';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import type {
  TransactionRequest,
  StartTransactionResponse,
} from '../types/transaction.types';

type FormState = 'form' | 'submit' | 'success' | 'error';

const TRANSACTION_TYPES = [
  'PAYMENT',
  'TRANSFER',
  'PURCHASE',
  'WITHDRAWAL',
  'DEPOSIT',
] as const;

const MERCHANT_CATEGORIES = [
  'GROCERIES',
  'ENTERTAINMENT',
  'UTILITIES',
  'HEALTHCARE',
  'TRANSPORTATION',
  'DINING',
  'SHOPPING',
  'OTHER',
] as const;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CLP'] as const;

const DEVICES = ['web-browser', 'mobile-app', 'tablet', 'desktop'] as const;

function Transfer() {
  const [formData, setFormData] = useState<TransactionRequest>({
    senderAccountNumber: '',
    receiverAccountNumber: '',
    amount: 0,
    type: 'PAYMENT',
    merchantCategory: 'OTHER',
    location: '',
    currency: 'USD',
    description: '',
    receiverContact: '',
    receiverEmail: '',
    device: 'web-browser',
    ipAddress: '',
  });

  const [txCountry, setTxCountry] = useState('');
  const [txRegion, setTxRegion] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse>();
  const [formState, setFormState] = useState<FormState>('form');
  const [transactionResponse, setTransactionResponse] =
    useState<StartTransactionResponse>();
  const [formError, setFormError] = useState<Error>();
  const navigate = useNavigate();
  const rotation = useRef(0);

  // Fetch user accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await getUserAccounts();
        setAccounts(result || []);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setFormError(new Error('Failed to load accounts'));
      }
    };
    fetchAccounts();
  }, []);

  // Update selected account when account number changes
  useEffect(() => {
    if (!accounts || !formData.senderAccountNumber) return;
    const selected = accounts.find(
      (account) => account.accountNumber === formData.senderAccountNumber,
    );
    setSelectedAccount(selected);
  }, [formData.senderAccountNumber, accounts]);

  // Get user's IP address
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setFormData((prev) => ({ ...prev, ipAddress: data.ip }));
      } catch (error) {
        console.error('Failed to fetch IP:', error);
        setFormData((prev) => ({ ...prev, ipAddress: '0.0.0.0' }));
      }
    };
    fetchIpAddress();
  }, []);

  // Set location when country/region changes
  useEffect(() => {
    if (txCountry && txRegion) {
      setFormData((prev) => ({
        ...prev,
        location: `${txRegion}, ${txCountry}`,
      }));
    } else if (txCountry) {
      setFormData((prev) => ({
        ...prev,
        location: txCountry,
      }));
    }
  }, [txCountry, txRegion]);

  const handleRotate = () => {
    const img = document.getElementById('appLogo');
    if (img) {
      rotation.current += ANIMATION.ROTATION_DEGREES;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = `transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const validateForm = (): boolean => {
    // Validate sender account
    if (!formData.senderAccountNumber) {
      setFormError(new Error('Please select a sender account'));
      return false;
    }

    // Validate receiver account
    if (!formData.receiverAccountNumber) {
      setFormError(new Error('Please enter receiver account number'));
      return false;
    }

    // Check if sender and receiver are different
    if (formData.senderAccountNumber === formData.receiverAccountNumber) {
      setFormError(new Error('Cannot transfer to the same account'));
      return false;
    }

    // Validate amount
    if (formData.amount <= 0) {
      setFormError(new Error('Amount must be greater than 0'));
      return false;
    }

    // Check sufficient balance
    if (selectedAccount && formData.amount > selectedAccount.balance) {
      setFormError(new Error('Insufficient balance'));
      return false;
    }

    // Validate location
    if (!formData.location || formData.location.trim() === '') {
      setFormError(new Error('Please select transaction location'));
      return false;
    }

    // Validate receiver email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.receiverEmail)) {
      setFormError(new Error('Invalid receiver email'));
      return false;
    }

    // Validate password
    if (!password) {
      setFormError(new Error('Password is required'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);

    if (!validateForm()) {
      setFormState('error');
      return;
    }

    setFormState('submit');

    try {
      const response = await transaction(formData);
      setTransactionResponse(response);

      if (response.status === 'PENDING' || response.status === 'COMPLETED') {
        setFormState('success');
        // Reset form
        setFormData({
          senderAccountNumber: '',
          receiverAccountNumber: '',
          amount: 0,
          type: 'PAYMENT',
          merchantCategory: 'OTHER',
          location: '',
          currency: 'USD',
          description: '',
          receiverContact: '',
          receiverEmail: '',
          device: 'web-browser',
          ipAddress: formData.ipAddress,
        });
        setPassword('');
        setTxCountry('');
        setTxRegion('');
      } else {
        setFormError(new Error(response.message || 'Transaction failed'));
        setFormState('error');
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err : new Error('Transaction failed'),
      );
      setFormState('error');
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
          <FiCheckCircle className="text-6xl text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Transaction Submitted Successfully!
        </h2>
        {transactionResponse && (
          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <p className="text-white mb-2">
              <strong>Transaction ID:</strong>{' '}
              {transactionResponse.transactionId}
            </p>
            <p className="text-white mb-2">
              <strong>Status:</strong> {transactionResponse.status}
            </p>
            <p className="text-white/80 text-sm">
              {transactionResponse.message}
            </p>
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => setFormState('form')}
            className={`${components.button.secondary} flex-1`}
          >
            New Transaction
          </button>
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className={`${components.button.primary} flex-1`}
          >
            Go to Dashboard
          </button>
        </div>
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
          <FiXCircle className="text-6xl text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-red-200 mb-2">
          Transaction Failed
        </h2>
        <p className="text-red-300 mb-4">
          {formError?.message || 'An unknown error occurred'}
        </p>
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
          <FiLoader className="text-6xl text-blue-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Processing Transaction...
        </h2>
        <p className="text-gray-300">
          Please wait while we validate and process your transaction
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.gradients.primary} flex flex-col `}>
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
        {/* Form State */}
        {formState === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <form onSubmit={handleSubmit}>
              <div
                className={`${colors.gradients.card} rounded-2xl p-8 shadow-2xl`}
              >
                {/* Logo Section */}
                <div className="text-center mb-8">
                  <img
                    id="appLogo"
                    onClick={handleRotate}
                    className="w-20 h-20 mx-auto rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 mb-4"
                    src={RESOURCES.LOGO}
                    alt="App Logo"
                    title="Click to rotate!"
                  />
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Send Money
                  </h1>
                  <p className="text-white/80">Transfer funds securely</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-x-2">
                    {/* Sender Account */}
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center gap-2">
                        <FiCreditCard />
                        From Account
                      </label>
                        <select
                          className={components.input.primary}
                          value={formData.senderAccountNumber}
                          onChange={handleChange}
                          name="senderAccountNumber"
                          required
                        >
                          <option value="">Select sender account...</option>
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

                    {/* Receiver Account */}
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center gap-2">
                        <FiUser />
                        To Account Number
                      </label>
                      <input
                        className={components.input.primary}
                        type="text"
                        name="receiverAccountNumber"
                        value={formData.receiverAccountNumber}
                        onChange={handleChange}
                        placeholder="Enter receiver account number"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-x-1">
                    {/* Amount */}
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center gap-2">
                        <FiDollarSign />
                        Amount
                      </label>
                      <input
                        className={components.input.primary}
                        type="number"
                        name="amount"
                        value={formData.amount || ''}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                      {selectedAccount && (
                        <p className="text-white/60 text-sm mt-1">
                          Available: ${selectedAccount.balance.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Transaction Type & Currency */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Currency
                      </label>
                      <select
                        className={components.input.primary}
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        required
                      >
                        {CURRENCIES.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Type
                      </label>
                      <select
                        className={components.input.primary}
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        {TRANSACTION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Merchant Category */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Category
                      </label>
                      <select
                        className={components.input.primary}
                        name="merchantCategory"
                        value={formData.merchantCategory}
                        onChange={handleChange}
                        required
                      >
                        {MERCHANT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                      <FiMapPin />
                      Transaction Location
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <CountryDropdown
                        className={components.input.primary}
                        value={txCountry}
                        onChange={setTxCountry}
                      />
                      <RegionDropdown
                        className={components.input.primary}
                        country={txCountry}
                        value={txRegion}
                        onChange={setTxRegion}
                      />
                    </div>
                  </div>

                  {/* Receiver Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Receiver Name
                      </label>
                      <input
                        className={components.input.primary}
                        type="text"
                        name="receiverContact"
                        value={formData.receiverContact}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center gap-2">
                        <FiMail />
                        Receiver Email
                      </label>
                      <input
                        className={components.input.primary}
                        type="email"
                        name="receiverEmail"
                        value={formData.receiverEmail}
                        onChange={handleChange}
                        placeholder="receiver@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Device */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Device
                    </label>
                    <select
                      className={components.input.primary}
                      name="device"
                      value={formData.device}
                      onChange={handleChange}
                      required
                    >
                      {DEVICES.map((device) => (
                        <option key={device} value={device}>
                          {device}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                      <FiInfo />
                      Description
                    </label>
                    <textarea
                      className={`${components.input.primary} min-h-[80px]`}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Payment for services..."
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                      <FiLock />
                      Account Password
                    </label>
                    <div className="relative">
                      <input
                        className={`${components.input.primary} pr-10`}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
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
                    // disabled={!selectedAccount || formState === 'form'}
                  >
                    <FiSend />
                    Send Money
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Other States */}
        {formState === 'submit' && (
          <div className="w-full max-w-md">
            <LoadingDisplay />
          </div>
        )}

        {formState === 'success' && (
          <div className="w-full max-w-md">
            <SuccessDisplay />
          </div>
        )}

        {formState === 'error' && (
          <div className="w-full max-w-md">
            <ErrorDisplay />
          </div>
        )}

        {/* Selected Account Display */}
        {selectedAccount && formState === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full max-w-2xl mt-6"
          >
            <div className={components.card.primary}>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiCreditCard className="text-blue-600" />
                Selected Account Details
              </h3>
              {displayAccountResponseComponent(
                selectedAccount,
                'space-y-3',
                'text-sm font-semibold text-gray-600 uppercase',
                'text-lg font-bold text-gray-900',
              )}
            </div>
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

export default Transfer;
