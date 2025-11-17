import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiArrowLeft, FiCreditCard, FiMapPin,
  FiCheckCircle, FiXCircle, FiLoader
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth.hook';
import { createAccount } from '../services/api.service';
import {
  type AccountResponse,
  type CreateAccountDto,
  AccountType,
} from '../services/dto/account.types';
import { ANIMATION, RESOURCES, ROUTES } from '../utils/constants';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { colors, components } from '../utils/design-system';

function AddAccount() {
  type CreateAccountState = 'form' | 'submit' | 'success' | 'error';

  const [formData, setFormData] = useState<CreateAccountDto>({
    type: 'SAVINGS',
    bankBranch: '',
  });

  const { user } = useAuth();
  const [createdAccount, setNewCreatedAccount] = useState<AccountResponse>();
  const [creationState, setCreationState] = useState<CreateAccountState>('form');
  const [country, setCountry] = useState('');
  const navigate = useNavigate();
  const rotation = useRef(0);
  const [creationError, setCreationError] = useState<Error>();

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setFormData((prev) => ({
      ...prev,
      bankBranch: '', // Reset region when country changes
    }));
  };

  const handleRegionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      bankBranch: value,
    }));
  };

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
    
    try {
      const userCreateAccountRequest: CreateAccountDto = { ...formData };
      const response = await createAccount(userCreateAccountRequest);
      setNewCreatedAccount(response);
      setCreationState('success');
    } catch (err) {
      setCreationState('error');
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
        <h2 className="text-2xl font-bold text-white mb-4">Cuenta Creada!</h2>
        {createdAccount && (
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-300 font-medium">Numero de cuenta</dt>
                <dd className="text-white font-bold">{createdAccount.accountNumber}</dd>
              </div>
              <div>
                <dt className="text-gray-300 font-medium">Tipo</dt>
                <dd className="text-white font-bold">{createdAccount.type}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-300 font-medium">Saldo</dt>
                <dd className="text-2xl text-green-400 font-bold">${createdAccount.balance}</dd>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className={`${components.button.primary} w-full`}
        >
          Ir al Dashboard
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
        <h2 className="text-xl font-bold text-red-200 mb-2">Error al Crear Cuenta</h2>
        <p className="text-red-300 mb-4">{creationError?.message || 'Ocurrió un error desconocido'}</p>
        <button
          onClick={() => setCreationState('form')}
          className={`${components.button.secondary} w-full`}
        >
          Intentar de nuevo
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
        <h2 className="text-xl font-bold text-white mb-2">Creando Cuenta...</h2>
        <p className="text-gray-300">Por favor espera mientras configuramos tu cuenta</p>
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
          Volver
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
                    className="w-20 h-20 mx-auto rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 mb-4"
                    src={RESOURCES.LOGO}
                    alt="App Logo"
                    title="Click to rotate!"
                  />
                  <h1 className="text-2xl font-bold text-white mb-2">Crear Nueva Cuenta</h1>
                  <p className="text-white/80">Agrega una nueva cuenta a tu perfil</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  {/* Account Type */}
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                      <FiCreditCard />
                      Tipo de Cuenta
                    </label>
                    <select
                      className={components.input.primary}
                      value={formData.type}
                      onChange={handleChange}
                      name="type"
                      required
                    >
                      {Object.entries(AccountType).map(([key, value]) => (
                        <option key={key} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bank Branch Location */}
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                      <FiMapPin />
                      Ubicación de la Sucursal
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CountryDropdown
                        className={`${components.input.primary} cursor-pointer`}
                        onChange={handleCountryChange}
                        value={country}
                      />
                      <RegionDropdown
                        className={`${components.input.primary} cursor-pointer`}
                        onChange={handleRegionChange}
                        value={formData.bankBranch as string}
                        country={country}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    className={`${components.button.primary} w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    type="submit"
                    disabled={creationState.toString() === 'submit' || !formData.bankBranch}
                  >
                    <FiPlus />
                    Crear Cuenta
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

export default AddAccount;
