import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiUser, FiMail, FiLock, FiCalendar, FiMapPin, 
  FiEye, FiEyeOff, FiUserPlus, FiArrowRight 
} from 'react-icons/fi';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { useAuth } from '../hooks/useAuth.hook';
import type { RegisterCredentials } from '../types/auth.types';
import { ROUTES, ANIMATION, RESOURCES } from '../utils/constants';
import { colors, components } from '../utils/design-system';

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

  const [showPassword, setShowPassword] = useState(false);
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

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
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
    <div className={`min-h-screen flex flex-col ${colors.gradients.primary}`}>
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        {/* Main Card */}
        <div className=" text-sm w-full max-w-lg ">
          <form  onSubmit={handleSubmit}>
            <div className={`${colors.gradients.card} rounded-2xl p-8 shadow-2xl transform hover:scale-105 transition-all duration-300`}>
              {/* Logo Section */}
              <div className="text-center mb-8">
                {/* <img
                  id="appLogo"
                  onClick={handleRotate}
                  className="w-20 h-20 mx-auto rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 mb-4"
                  src={RESOURCES.LOGO}
                  alt="App Logo"
                  title="Click to rotate!"
                /> */}
                <h1 className="text-3xl font-bold text-white mb-2">Join DataBank!</h1>
                <p className="text-white/80">Create your account today</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-2 bg-red-500/20 border border-red-400 rounded-lg text-red-200 text-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-2">
                {/* Name and RUT Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        name="username"
                        className={`${components.input.primary} pl-10 py-2`}
                        placeholder="Enter username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      RUT
                    </label>
                    <input
                      name="rut"
                      className={`${components.input.primary} py-2`}
                      placeholder="Enter RUT"
                      type="text"
                      value={formData.rut}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email and Password Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        name="email"
                        className={`${components.input.primary} py-2 pl-10`}
                        placeholder="Enter email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        name="password"
                        className={`${components.input.primary} py-2 pl-10 pr-10`}
                        placeholder="Enter password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
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
                </div>

                {/* Birthday */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Birthday
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      name="birthday"
                      className={`${components.input.primary} pl-10 py-2`}
                      type="date"
                      value={formData.birthday}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-white font-medium mb-2 flex items-center gap-2">
                    <FiMapPin />
                    Location
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CountryDropdown
                      className={`${components.input.primary} cursor-pointer py-2`}
                      onChange={handleCountryChange}
                      value={formData.country}
                      disabled={isLoading}
                    />
                    <RegionDropdown
                      className={`${components.input.primary} cursor-pointer py-2`}
                      onChange={handleRegionChange}
                      country={formData.country}
                      value={formData.region}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  className={`${components.button.primary} w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6`}
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiUserPlus />
                      Create Account
                      <FiArrowRight />
                    </>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-white/80">
                    Already have an account?{' '}
                    <Link
                      to={ROUTES.LOGIN}
                      className="font-bold text-white hover:text-blue-200 transition-colors duration-200 underline"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
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

export default Register;
