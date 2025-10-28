import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.hook';
import { createAccount } from '../services/api.service';
import {
  type AccountResponse,
  type CreateAccountDto,
  AccountType,
} from '../services/dto/account.types';
import { ANIMATION, RESOURCES } from '../utils/constants';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';

function AddAccount() {
  type CreateAccountState = 'form' | 'submit' | 'success' | 'error';

  const [formData, setFormData] = useState<CreateAccountDto>({
    type: 'SAVINGS',
    bankBranch: '',
  });

  const { user } = useAuth();

  const [createdAccount, setNewCreatedAccount] = useState<AccountResponse>();

  const [creationState, setCreationState] =
    useState<CreateAccountState>('form');
  const [country, setCountry] = useState('');

  const navigate = useNavigate();

  const rotation = useRef(0);

  const [creationError, setCreationError] = useState<Error>();
  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
      // Reset region when country changes
      region: '',
    }));
  };

  const handleRegionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      bankBranch: value,
    }));
  };
  function displayAccountPropertie(
    key: string,
    value: string | undefined,
  ): React.ReactNode {
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{key}</dt>
        <dd className=" text-sm text-gray-900">{value}</dd>
      </div>
    );
  }
  function showNewAccount() {
    return (
      <>
        <div className="bg-white rounded-lg p-2">
          <h2 className="text-xl font-bold text-gray-900 ">Cuenta Creada !</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
            {displayAccountPropertie(
              'Numero de cuenta',
              createdAccount?.accountNumber,
            )}
            {displayAccountPropertie('Cuenta: ', createdAccount?.type)}
            {displayAccountPropertie(
              'Saldo: ',
              createdAccount?.balance?.toString(),
            )}
          </dl>
        </div>
      </>
    );
  }
  function showFormSubmitLoad() {
    return (
      <>
        <div className="w-16">
          <img src="public/loading-gif-3262986532.gif" alt="" />
        </div>
      </>
    );
  }
  function displayError() {
    return <>{creationError}</>;
  }
  function displayDoingForm() {
    return <></>;
  }

  function handleCreationResponse() {
    switch (creationState) {
      case 'form':
        // Handle loading state
        return displayDoingForm();
      case 'submit':
        return showFormSubmitLoad();
      case 'success':
        // Handle success state
        return showNewAccount();
      case 'error':
        // Handle error state

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
    setCreationState('submit');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const userCreateAccountRequest: CreateAccountDto = {
      ...formData,
    };
    try {
      const response = await createAccount(userCreateAccountRequest);

      setNewCreatedAccount(response);
      setCreationState('success');
    } catch (err) {
      setCreationState('error');
      setCreationError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  function AccountTypePicker() {
    return (
      <>
        <div>
          <label htmlFor="AccountTypeSelector">Select Account type</label>
          <select
            className="rounded w-full p-2"
            value={formData.type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFormData((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
              }))
            }
            name="type"
            id="AccountTypeSelector"
          >
            {Object.entries(AccountType).map(([key, value]) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
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
      <div className="flex flex-col items-center justify-center flex-1">
        <form onSubmit={handleSubmit} className="flex flex-row">
          <div
            id="create-account-form"
            className="flex flex-col items-center gap-[5vh] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 box-border drop-shadow-sm w-64 p-5 rounded-lg bg-shadow flex-shrink-0 h-4/5 md:w-75 md:gap-10"
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

            {AccountTypePicker()}
            <div className="flex flex-row gap-2">
              <div>
                <p>Sucursal bancaria</p>
                <div className=" grid grid-cols-2 gap-2 h-8 ">
                  <CountryDropdown
                    className="center rounded border border-gray-300"
                    onChange={setCountry}
                    value={country}
                  />

                  <RegionDropdown
                    className="center rounded border border-gray-300"
                    onChange={handleRegionChange}
                    value={formData.bankBranch as string}
                    country={country}
                  />
                </div>
              </div>
            </div>
            <button
              className="bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          {handleCreationResponse()}
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

export default AddAccount;
