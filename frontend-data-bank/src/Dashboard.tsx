import React, { useRef, useState } from 'react';
import { useAuth } from './hooks/useAuth.hook';
import { RESOURCES } from './utils/constants';
import { tokenStorage } from './utils/storage';

function userData(label: string,data: string) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{data}</dd>
    </div>
  );
}
function Dashboard() {
  const { user, logout } = useAuth();
  
  const rotation = useRef(0);
  const [open, setOpen] = useState(false);
  const [showId, setShowId] = useState(false);

  const handleRotate = () => {
    const img = document.getElementById('dashboardLogo');
    if (img) {
      rotation.current += 360;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = 'transform 1s ease-in-out';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* First barra */}
      <nav className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">
            {/* Logo */}
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

            {/* Centro */}
            <h1 className="text-xl font-semibold text-white text-center">
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
                  <button
                    onClick={() => alert('Otra opción')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Otra opción
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-20">
        <div className="grid grid-cols-2">
          <div className="relative m-20">
            {/* Recuadro blanco */}
            <div className="bg-white shadow rounded-3xl p-5">
              {/* MiCuenta */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Mi Cuenta
              </h2>

              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-4">
                <div>
                  {/* ID */}
                  <dt className="text-lg font-medium text-gray-500">ID</dt>
                  <dd className="mt-1 text-2xl text-gray-900">
                    {showId ? user?.id : 'XXXXXXXXXXXXXXXXXXXXXXXX'}
                  </dd>
                </div>
              </dl>
            </div>
            {/* Ícono afuera del recuadro */}
            <img
              id="showInfo"
              onClick={() => setShowId(!showId)}
              className="absolute top-1/5 right-0 transform translate-x-10 -translate-y-12 
                        w-8 h-8 cursor-pointer hover:shadow-lg transition-shadow duration-200"
              src={'../public/warning-circle.png'}
              alt="Warning"
              title="Show Info"
            />
          </div>

          {/* User */}
          <div className="bg-white shadow rounded-lg p-6 m-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              User Profile
            </h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {user
                ? Object.entries(user).map(([key, value]) => (
                    userData(String(key), String(value))
                  ))
                : null};
              
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  BEARER TOKEN
                </dt>
                <dd className="mt-1 text-sm text-gray-900 break-all">
                  {tokenStorage.get()}
                </dd>
              </div>


            </dl>
          </div>

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
          <div className="bg-white shadow rounded-lg p-6 m-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Cards</h2>
              <button
                className="hover:bg-gray-300 text-white px-0 py-0 rounded-lg text-xl transition duration-200"
                onClick={() => alert('Show next card')}
              >
                ➡️
              </button>
            </div>

            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Id</dt>
                <dd className="mt-1 text-sm text-gray-900">{}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">cvv</dt>
                <dd className="mt-1 text-sm text-gray-900">{}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">number</dt>
                <dd className="mt-1 text-sm text-gray-900">{}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">penalties</dt>
                <dd className="mt-1 text-sm text-gray-900">{}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  spentLimit
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{}</dd>
              </div>
            </dl>
          </div>

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
