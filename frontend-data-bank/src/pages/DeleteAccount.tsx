import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.hook";
import { getUserAccounts, getCards, deleteAccount } from "../services/api.service";
import type { AccountResponse, CardResponse } from "../services/dto/account.types";
import { ROUTES, ANIMATION, RESOURCES } from "../utils/constants";

 
function DeleteAccount() {
  type FormDeleteState = 'form' | 'submit' | 'success' | 'error';

  const [formData, setFormData] = useState({
    accountNumber: '',
  });

  const { user } = useAuth();

  const [accounts, setAccounts] = useState<AccountResponse[]>();
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse>();
  const [cards, setCards] = useState<CardResponse[]>();
  const [creationState, setDeletionState] = useState<FormDeleteState>('form');

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

  // Separate useEffect for fetching cards when selected account changes
  useEffect(() => {
    const fetchCards = async () => {
      if (!selectedAccount?.id) return;

      try {
        const cards = await getCards(selectedAccount.id);
        setCards(cards);
      } catch (err) {
        console.error('Failed to fetch cards:', err);
        setCards([]);
      }
    };

    fetchCards();
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
        <p>Account deleted successfully</p>
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
  function handleDeletionResponse() {
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

    if (!selectedAccount?.id) {
      setDeletionState('error');
      setCreationError(new Error('No account selected'));
      return;
    }

    setDeletionState('submit');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const response = await deleteAccount(selectedAccount.id); // Now guaranteed to be string
      console.log(response);
      setDeletionState('success');
    } catch (err) {
      setDeletionState('error');
      setCreationError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  function AccountIdPicker() {
    function showCards(): React.ReactNode {
      return (
        <>
          {cards && cards.length > 0 ? (
            <ul>
              {cards.map((card) => (
                <li key={card.id}>{card.id}</li>
              ))}{' '}
            </ul>
          ) : (
            <p> No cards associated to this account </p>
          )}
        </>
      );
    }

    return (
      <>
        <div >
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
          <label htmlFor="AccountIdPicker" className='font-semibold'>Select Account</label>
          <select
            className="rounded w-full p-2 bg-white text-black font-semibold"
            value={formData.accountNumber}
            onChange={handleChange}
            name="accountNumber"
            id="AccountIdPicker"
          >
            <option value="">Select an account</option>
            {accounts && accounts.length > 0 ? (
              accounts.map((account) => (
                <option
                  key={account.accountNumber}
                  value={account.accountNumber}
                >
                  {account.accountNumber} - {account.type} (${account.balance})
                </option>
              ))
            ) : (
              <option disabled>No hay Cuentas disponibles</option>
            )}
          </select>
          <div className='mt-2'>
            <label htmlFor="cards" className='font-semibold'>Cards</label>
            <div
              id="cards"
              className="bg-white text-black border-white border-1 rounded-lg p-1 "
            >
              {''}
              {selectedAccount ? <div> {showCards()}</div> : <></>}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-black">
      <div className="flex flex-col items-center justify-center flex-1">
        <form onSubmit={handleSubmit} className="flex flex-row">
          <div
            id="delete-account-form"
            className="flex flex-col items-center gap-[5vh] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 box-border drop-shadow-sm w-80 p-5 rounded-lg bg-shadow flex-shrink-0 h-4/5 md:gap-10"
          >
            {/* Rotating Logo */}
            <img
              id="appLogo"
              onClick={handleRotate}
              className=" w-1/2 mt-5 md:mt-3 md:mb-0 md:pb-0 rounded-xl cursor-pointer hover:shadow-lg transition-shadow duration-200"
              src={RESOURCES.LOGO}
              alt="App Logo"
              title="Click to rotate!"
            />

            {AccountIdPicker()}
            <button
              className="bg-white hover:bg-gray-800 text-black font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </form>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-3 mt-2"
        >
          {handleDeletionResponse()}
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

export default DeleteAccount;
