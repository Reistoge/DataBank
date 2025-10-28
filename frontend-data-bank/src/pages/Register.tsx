import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
 
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { useAuth } from '../hooks/useAuth.hook';
import type { RegisterCredentials } from '../types/auth.types';
import { ROUTES, ANIMATION, RESOURCES } from '../utils/constants';

function Register() {
  const [formData, setFormData] = useState({
    rut: '',
    username: '',
    email: '',
    password: '',
    birthday: '',
    country: '',
    region: '',
  });

  const { register, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const rotation = useRef(0);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  console.log(`${rotation.current} app re-rendered`);

  const handleRotate = () => {
    const img = document.getElementById('appLogo');
    if (img) {
      rotation.current += ANIMATION.ROTATION_DEGREES;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = `transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // Add these new handlers specifically for dropdowns
  const   handleCountryChange = (value: string) => {
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
      region: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userRegisterRequest: RegisterCredentials = {
      rut: formData.rut,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      birthday: formData.birthday,
      country: formData.country,
      region: formData.region,
    };
    await register(userRegisterRequest);
  };

  return (
    <div className="min-h-screen flex flex-col">

      <div className="flex flex-col items-center flex-1 gap-1">
        <h1 className="ml-4 h-12 mt-5 mb-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-white to-indigo-700 text-left">
          Register
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-row">
          <div
            id="sign-in"
            className="flex flex-col items-center gap-[5vh] bg-gradient-to-r from-pink-500 
            via-white-600 to-indigo-700 box-border drop-shadow-sm  p-5 rounded-lg 
            bg-shadow flex-shrink-0 h-4/5 "
          >
            {/* Rotating Logo */}
            <img
              id="appLogo"
              onClick={handleRotate}
              className="w-24 mt-5 md:mt-3 md:mb-0 md:pb-0 rounded-xl cursor-pointer hover:shadow-lg transition-shadow duration-200"
              src={RESOURCES.LOGO}
              alt="App Logo"
              title="Click to rotate!"
            />

            {/* Form Fields */}
            <div className=" flex flex-col  gap-1 w-80  opacity-75 ">
              <div className="grid grid-cols-2 gap-2 ">
                <input
                  name="username"
                  className=" p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <input
                  name="rut"
                  className="  p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Rut"
                  type="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <input
                  name="email"
                  className="  p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <input
                  name="password"
                  className="  p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <article>
                <p>Birthday</p>
                <input
                  name="birthday"
                  className="  w-48 h-8 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Password"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </article>

              <div className="flex flex-row gap-2">
                <div>
                  <p>Address</p>
                  <div className=" grid grid-cols-2 gap-2 h-8 ">
                    <CountryDropdown
                      className="center rounded border border-gray-300"
                      onChange={handleCountryChange}
                      value={formData.country}
                      disabled={isLoading}
                    />

                    <RegionDropdown
                      className="center rounded border border-gray-300"
                      onChange={handleRegionChange}
                      country={formData.country}
                      value={formData.region}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <button
                className="mt-1 bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Submit'}
              </button>

              <p className="text-center text-white">
                Already have account?{' '}
                <Link
                  to={ROUTES.LOGIN}
                  className="font-bold underline hover:text-gray-200 transition-colors duration-200"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </form>
        {/* Error Display */}
        {error && (
          <div className="text-center  bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-sm w-48">
            {error}
          </div>
        )}
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

export default Register;
