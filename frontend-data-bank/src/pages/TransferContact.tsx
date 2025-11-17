import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSend,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiDollarSign,
  FiUser,
  FiMail,
  FiMapPin,
  FiCreditCard,
  FiInfo,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import displayAccountResponseComponent from '../components/display-account.component';
import { useAuth } from '../hooks/useAuth.hook';
import { getUserAccounts, makeAccountTransfer, getContacts } from '../services/api.service';
import type { AccountResponse } from '../services/dto/account.types';
import { ROUTES, ANIMATION, RESOURCES } from '../utils/constants';
import { colors, components } from '../utils/design-system';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import type {
  TransactionRequest,
  StartTransactionResponse,
} from '../types/transaction.types';
import type { Contact } from '../types/auth.types';

type FormState = 'selectContact' | 'form' | 'submit' | 'success' | 'error';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CLP'] as const;
const DEVICES = ['web-browser', 'mobile-app', 'tablet', 'desktop'] as const;

function TransferContact() {
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

  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse>();
  const [formState, setFormState] = useState<FormState>('selectContact');
  const [transactionResponse, setTransactionResponse] =
    useState<StartTransactionResponse>();
  const [formError, setFormError] = useState<Error>();
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const navigate = useNavigate();
  const rotation = useRef(0);

  // Fetch user accounts and contacts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingContacts(true);
      try {
        const [accountsResult, contactsResult] = await Promise.all([
          getUserAccounts(),
          getContacts(),
        ]);
        setAccounts(accountsResult || []);
        setContacts(contactsResult || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setFormError(new Error('Failed to load accounts or contacts'));
      } finally {
        setIsLoadingContacts(false);
      }
    };
    fetchData();
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

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData((prev) => ({
      ...prev,
      receiverAccountNumber: contact.accountNumber,
      receiverContact: contact.name,
      receiverEmail: contact.email,
      type: contact.type,
      merchantCategory: contact.category,
    }));
    setFormState('form');
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
    if (!formData.senderAccountNumber) {
      setFormError(new Error('Please select a sender account'));
      return false;
    }

    if (formData.amount <= 0) {
      setFormError(new Error('Amount must be greater than 0'));
      return false;
    }

    if (selectedAccount && formData.amount > selectedAccount.balance) {
      setFormError(new Error('Insufficient balance'));
      return false;
    }

    if (!formData.location || formData.location.trim() === '') {
      setFormError(new Error('Please select transaction location'));
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
      const response = await makeAccountTransfer(formData);
      setTransactionResponse(response);

      if (response.status === 'PENDING' || response.status === 'COMPLETED') {
        setFormState('success');

        setTimeout(() => {
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
          setTxCountry('');
          setTxRegion('');
          setSelectedContact(null);
        }, 100);
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

  // ✅ GOOD: Render inline JSX based on state
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
        <AnimatePresence mode="wait">
          {/* Contact Selection State */}
          {formState === 'selectContact' && (
            <motion.div
              key="selectContact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl"
            >
              <div className={`${components.card.gradient}`}>
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
                    Transfer to Contact
                  </h1>
                  <p className="text-white/80">Select a contact to send money to</p>
                </div>

                {isLoadingContacts ? (
                  <div className="text-center py-12">
                    <FiLoader className="text-6xl text-blue-400 animate-spin mx-auto mb-4" />
                    <p className="text-white">Loading contacts...</p>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <FiUsers className="text-6xl text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Contacts Yet</h3>
                    <p className="text-gray-300 mb-6">
                      You don't have any saved contacts. Make a regular transfer first to add contacts.
                    </p>
                    <button
                      onClick={() => navigate(ROUTES.TRANSFER)}
                      className={components.button.primary}
                    >
                      Go to Regular Transfer
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contacts.map((contact, index) => (
                      <motion.button
                        key={contact.accountNumber}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleContactSelect(contact)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-6 text-left transition-all duration-200 border-2 border-transparent hover:border-blue-400"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">
                              {contact.name}
                            </h3>
                            <p className="text-sm text-gray-400">{contact.type}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <FiCreditCard className="text-blue-400 flex-shrink-0" />
                            <span className="truncate">{contact.accountNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <FiMail className="text-green-400 flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Form State */}
          {formState === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl"
            >
              <form onSubmit={handleSubmit}>
                <div className={`${colors.gradients.card} rounded-2xl p-8 shadow-2xl`}>
                  <div className="text-center mb-8">
                    <img
                      id="appLogo"
                      onClick={handleRotate}
                      className="w-20 h-20 mx-auto rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 mb-4"
                      src={RESOURCES.LOGO}
                      alt="App Logo"
                      title="Click to rotate!"
                    />
                    <h1 className="text-3xl font-bold text-white mb-4">
                      Send Money
                    </h1>

                    {selectedContact && (
                      <div className="bg-white/10 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {selectedContact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <p className="text-white font-semibold">
                                {selectedContact.name}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {selectedContact.accountNumber}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormState('selectContact');
                              setSelectedContact(null);
                            }}
                            className="text-gray-400 hover:text-white text-sm"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
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

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

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

                    <button
                      className={`${components.button.primary} w-full flex items-center justify-center gap-2`}
                      type="submit"
                    >
                      <FiSend />
                      Send Money
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* Loading State */}
          {formState === 'submit' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`${components.card.gradient} text-center w-full max-w-md`}
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
          )}

          {/* Success State */}
          {formState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${components.card.gradient} text-center w-full max-w-md`}
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
                  <p className="text-white/80 text-sm mb-2">
                    {transactionResponse.message}
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => setFormState('selectContact')}
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
          )}

          {/* Error State */}
          {formState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/20 border border-red-400 rounded-xl p-6 text-center backdrop-blur-sm w-full max-w-md"
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
          )}
        </AnimatePresence>

        {/* Selected Account Display */}
        {selectedAccount && formState === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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

export default TransferContact;