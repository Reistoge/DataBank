import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.hook';
import {
  getUserAccounts,
  getCards,
  updateCardSpentLimit,
} from '../services/api.service';
import type {
  AccountResponse,
  CardResponse,
} from '../services/dto/account.types';
import type { User } from '../types/auth.types';
import { RESOURCES, ROUTES } from '../utils/constants';
import { tokenStorage } from '../utils/storage';
import { translate, userTranslations } from '../utils/translations';

function Dashboard() {
  const { user, logout } = useAuth();

  const rotation = useRef(0);
  const [open, setOpen] = useState(false);
  const [showId, setShowId] = useState(false);

  // accounts
  const [accountsData, setAccountsData] = useState<AccountResponse[]>([]);

  //cards
  const [cardsData, setCardsData] = useState<CardResponse[]>([]);

  const [selectedAccount, setSelectedAccount] =
    useState<AccountResponse | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [selectedCard, setSelectedCard] = useState<CardResponse>();

  // Add this useEffect to update selectedAccount when selectedAccountIndex changes
  useEffect(() => {
    if (accountsData.length > 0 && selectedAccountIndex < accountsData.length) {
      setSelectedAccount(accountsData[selectedAccountIndex]);
    }
  }, [selectedAccountIndex, accountsData]);

  useEffect(() => {
    if (cardsData.length > 0 && selectedCardIndex < cardsData.length) {
      setSelectedCard(cardsData[selectedCardIndex]);
    }
  }, [selectedCardIndex, cardsData]);

  // Add this useEffect to fetch accounts when component mounts
  useEffect(() => {
    // make the requests
    const fetchAccounts = async () => {
      try {
        // set loading state to await the fetch
        setIsLoadingAccounts(true);
        const accounts = await getUserAccounts();

        setAccountsData(accounts);

        // Auto-select first account if available
        if (accounts.length > 0) {
          setSelectedAccount(accounts[0]);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load accounts');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []); // Empty dependency array means run once on mount

  // Add this useEffect to fetch cards when selectedAccountId changes
  useEffect(() => {
    const fetchCards = async () => {
      if (!selectedAccount) return;

      try {
        setIsLoadingCards(true);
        const cards = await getCards(selectedAccount.id);
        setCardsData(cards);
        setSelectedCardIndex(0);
      } catch (err) {
        setError('Failed to load cards');
        console.error(err);
      } finally {
        setIsLoadingCards(false);
      }
    };

    fetchCards();
  }, [selectedAccount]); // Run when selectedAccount changes

  const handleRotate = () => {
    const img = document.getElementById('dashboardLogo');
    if (img) {
      rotation.current += 360;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = 'transform 1s ease-in-out';
    }
  };
  async function newSpentLimit(newLimit: number, accesPassword: string) {
    if (selectedCard) {
      await updateCardSpentLimit(selectedCard, newLimit, accesPassword);
      setSelectedCard(selectedCard);
    }
  }

  function userData(label: string, data: string, key: string) {
    return (
      <div key={key}>
        <dt className="underline text-m font-medium text-gray-500">
          {translate<User>(label as keyof User, userTranslations)}
        </dt>
        <dd className="px-1 mt-1 text-sm text-gray-900">{data}</dd>
      </div>
    );
  }

  function showUserData(user: User | null) {
    return (
      <div className="bg-white shadow rounded-lg p-6 m-2 h-fit">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">User Profile</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {user
            ? Object.entries(user)
                .filter(([key]) => key !== 'id') // Filter out 'id' before mapping
                .map(([key, value]) =>
                  userData(String(key), String(value), key),
                )
            : null}
          <div key="token">
            <dt className="text-sm font-medium text-gray-500">BEARER TOKEN</dt>
            <dd
              className="mt-1 text-sm text-gray-900 break-all cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => {
                const token = tokenStorage.get();
                if (token) {
                  navigator.clipboard.writeText(token);
                  alert('Token copied to clipboard!');
                }
              }}
              title="Click to copy token"
            >
              ••••••••••••••••• (Click to copy)
            </dd>
          </div>
        </dl>
      </div>
    );
  }
  function loadNextAccount() {
    setSelectedCardIndex(0);
    if (selectedAccountIndex + 1 >= accountsData.length) {
      setSelectedAccountIndex(0);
    } else {
      setSelectedAccountIndex(selectedAccountIndex + 1);
    }
  }

  function displayAccountProperties(): React.ReactNode {
    return selectedAccount
      ? Object.entries(selectedAccount)
          .filter(([key]) => key !== 'id' && key !== 'userId')
          .map(([key, value]) => (
            <dd key={key} className="mt-1 text-2xl text-gray-900">
              <dt className="text-lg font-medium text-gray-500">{key}</dt>
              {String(key) ? String(value) : 'XXXXXXXXXXXXXXXXXXXXXXXX'}
            </dd>
          ))
      : null;
  }

  function displayAccountPropertie(
    key: string,
    value: string | undefined,
  ): React.ReactNode {
    // add a stable key on the outer wrapper to satisfy React when children are rendered in sequence
    return (
      <div key={key}>
        <dt className="text-lg font-medium text-gray-500">{key}</dt>
        <dd className="mt-1 text-2xl text-gray-900">
          {showId ? value : 'XXXXXXXXXXXXXXXXX'}
        </dd>
      </div>
    );
  }

  function AccountSection(): React.ReactNode {
    console.log(`accounts ${accountsData}`);

    return (
      <div className="relative m-20">
        {/* Recuadro blanco */}

        <div className="bg-white shadow rounded-3xl p-5">
          <span
            id="showInfo"
            className="absolute right-5 top-5 cursor-pointer hover:shadow-lg transition-shadow duration-200 text-2xl"
            title="Show Info"
            onClick={loadNextAccount}
          >
            ➡️
          </span>

          {/* MiCuenta */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mi Cuenta</h2>
          <img
            id="showInfo"
            onClick={() => setShowId(!showId)}
            className=" w-8 h-8 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            src={'../public/warning-circle.png'}
            alt="Warning"
            title="Show Info"
          />
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
            {displayAccountPropertie(
              'Numero de cuenta',
              selectedAccount?.accountNumber,
            )}
            {displayAccountPropertie('Cuenta: ', selectedAccount?.type)}
            {displayAccountPropertie(
              'Saldo: ',
              selectedAccount?.balance?.toString(),
            )}
            {displayAccountPropertie(
              'Sucursal Bancaria: ',
              selectedAccount?.bankBranch?.toString(),
            )}
          </dl>
        </div>
        {/* Ícono afuera del recuadro */}
      </div>
    );
  }

  function showLogo(): React.ReactNode {
    return (
      <div className="flex items-center">
        <img
          id="dashboardLogo"
          onClick={handleRotate}
          className="w-10 h-10 rounded-full cursor-pointer hover:shadow-lg transition-shadow duration-200"
          src={RESOURCES.LOGO}
          alt="App Logo"
          title="Click to rotate!"
        />
      </div>
    );
  }
  function loadNextCard() {
    if (selectedCardIndex + 1 >= cardsData.length) {
      setSelectedCardIndex(0);
    } else {
      setSelectedCardIndex(selectedCardIndex + 1);
    }
  }

  function showCardPropertie(
    key: string,
    value: string | undefined,
  ): React.ReactNode {
    return (
      <div key={key}>
        <dt className="text-m underline text-gray-500 font-semibold">{key}</dt>
        <dd className=" px-1 mt-1 text-sm text-gray-900">{value}</dd>
      </div>
    );
  }
  function showCards(): React.ReactNode {
    const [newSpentLimit, setNewSpentLimit] = useState('');
    const [accessPassword, setAccessPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const handleUpdateSpentLimit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedCard) {
        setUpdateError('No card selected');
        return;
      }

      if (!newSpentLimit || !accessPassword) {
        setUpdateError('Please fill in all fields');
        return;
      }

      const limit = parseFloat(newSpentLimit);
      if (isNaN(limit) || limit < 0) {
        setUpdateError('Please enter a valid amount');
        return;
      }

      try {
        setIsUpdating(true);
        setUpdateError(null);
        setUpdateSuccess(false);

        await updateCardSpentLimit(selectedCard, limit, accessPassword);

        // Refresh cards data after successful update
        if (selectedAccount) {
          const cards = await getCards(selectedAccount.id);
          setCardsData(cards);

          // Update selected card with new data
          const updatedCard = cards.find((c) => c.id === selectedCard.id);
          if (updatedCard) {
            setSelectedCard(updatedCard);
          }
        }

        setUpdateSuccess(true);
        setNewSpentLimit('');
        setAccessPassword('');

        // Clear success message after 3 seconds
        setTimeout(() => setUpdateSuccess(false), 3000);
      } catch (err) {
        setUpdateError(
          err instanceof Error ? err.message : 'Failed to update spent limit',
        );
      } finally {
        setIsUpdating(false);
      }
    };

    console.log(`cards: ${cardsData}`);

    return (
      <div className="bg-white shadow rounded-lg p-6 m-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Cards</h2>
          <button
            className="hover:bg-gray-300 text-gray-900 px-3 py-1 rounded-lg text-xl transition duration-200"
            onClick={loadNextCard}
            disabled={cardsData.length === 0}
          >
            ➡️
          </button>
        </div>

        {cardsData.length === 0 ? (
          <p className="text-gray-500">No cards for this account</p>
        ) : (
          <>
            {/* Card Display */}
            <div className="m-5 border-2 p-5 rounded">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {selectedCard && (
                  <>
                    {showCardPropertie(
                      'Numero de Tarjeta',
                      selectedCard?.number,
                    )}
                    {showCardPropertie('CVV', selectedCard?.cvv.toString())}
                    {showCardPropertie(
                      'Sanciones',
                      selectedCard?.penalties.toString(),
                    )}
                    {selectedCard?.spentLimit &&
                    selectedCard.spentLimit >= Number.MAX_VALUE
                      ? showCardPropertie('Limite de gasto', 'Indefinido')
                      : showCardPropertie(
                          'Limite de gasto',
                          selectedCard?.spentLimit?.toString(),
                        )}
                  </>
                )}
              </dl>
            </div>

            {/* Update Spent Limit Form */}
            <form
              onSubmit={handleUpdateSpentLimit}
              className="border-t-2 mt-3 pt-4 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Actualizar Limite de Gasto
              </h3>

              {/* Error Message */}
              {updateError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {updateError}
                </div>
              )}

              {/* Success Message */}
              {updateSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  ✓ Limite de gasto actualizado exitosamente
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label
                  htmlFor="newSpentLimit"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nuevo Limite
                </label>
                <input
                  type="number"
                  id="newSpentLimit"
                  name="newSpentLimit"
                  value={newSpentLimit}
                  onChange={(e) => setNewSpentLimit(e.target.value)}
                  className="text-gray-900 w-full border bg-white border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ingrese cantidad"
                  min="0"
                  step="0.01"
                  disabled={isUpdating}
                />
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="accessPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  id="accessPassword"
                  name="accessPassword"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  className="text-gray-900 w-full border bg-white border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ingrese contraseña"
                  disabled={isUpdating}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUpdating || !selectedCard}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {isUpdating ? 'Actualizando...' : 'Actualizar'}
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black">
      {/* First barra */}
      <nav className="bg-gradient-to-r from-pinks-500 via-purple-500 to-indigo-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">
            {showLogo()}

            {/* Centro */}
            <h1 className="text-xl font-bold text-white text-center">
              DataBank
            </h1>

            {/* Usuario */}

            <div className="flex justify-end items-center space-x-4 relative">
              <span className="text-white">Welcome, {user?.username}! 👋</span>

              {/* Icono de Configuración */}
              <img
                id="showInfo"
                onClick={() => setOpen(!open)}
                className="w-8 h-8 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                src={'../public/configIMG.png'}
                alt="Configuracion"
                title="Configuracion"
              />

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 top-12 bg-white rounded-md shadow-lg py-2 w-40 z-50">
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                  <Link
                    to={ROUTES.ADD_ACCOUNT}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 block"
                  >
                    Add Account
                  </Link>
                  <Link
                    to={ROUTES.DELETE_ACCOUNT}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 block"
                  >
                    Delete Account
                  </Link>
                  <Link
                    to={ROUTES.ADD_CARD}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 block"
                  >
                    Add Card
                  </Link>
                  <Link
                    to={ROUTES.DELETE_CARD}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 block"
                  >
                    Delete Card
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-20">
        <div className="grid grid-cols-2">
          {AccountSection()}
          {showUserData(user)}
          {showCards()}
          {/* Transaction form */}
          <div className=" bg-white shadow rounded-lg p-6 m-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              New Transaction
            </h3>
            <form className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="recipient"
                >
                  Recipient
                </label>
                <input
                  type="text"
                  id="recipient"
                  name="recipient"
                  className="text-gray-900 mt-1 block w-full border bg-white border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter recipient username or ID"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="amount"
                >
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  className="text-gray-900 mt-1 block w-full border bg-white border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="description"
                >
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  className="text-gray-900 mt-1 block w-full border bg-white border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Optional description"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition"
              >
                Send Transaction
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2">
          {/* Cards */}

          {/* History */}
          <div className="bg-white shadow rounded-lg p-6 m-2   ">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">History</h2>
              <button
                className="hover:bg-gray-300 text-white px-0 py-0 rounded-lg text-xl transition duration-200"
                onClick={() => alert('Show full history')}
              >
                🔍
              </button>
            </div>

            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Transaction 1
                </dt>
                <dd className="mt-1 text-sm text-gray-900">info1</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Transaction 2
                </dt>
                <dd className="mt-1 text-sm text-gray-900">info2</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Transaction 3
                </dt>
                <dd className="mt-1 text-sm text-gray-900">info3</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Transaction 4
                </dt>
                <dd className="mt-1 text-sm text-gray-900">info4</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Transaction 5
                </dt>
                <dd className="mt-1 text-sm text-gray-900">info5</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Transaction form section */}
      </main>
    </div>
  );
}

export default Dashboard;
