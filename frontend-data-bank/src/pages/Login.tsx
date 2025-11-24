import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth.hook";
import type { LoginCredentials } from "../types/auth.types";
import { ROUTES, ANIMATION, RESOURCES } from "../utils/constants";
import { colors, components } from "../utils/design-system";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();
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
    const img = document.getElementById("appLogo");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userLoginRequest: LoginCredentials = {
      email: formData.email,
      password: formData.password,
    };
    await login(userLoginRequest);
  };

  return (
    <div className={`min-h-screen flex flex-col ${colors.gradients.primary}`}>
      <div className="flex flex-col items-center justify-center flex-1 px-4">
        {/* Main Card */}
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <div className={`${colors.gradients.card} rounded-2xl p-8 shadow-2xl transform hover:scale-105 transition-all duration-300 `}>
              {/* Logo Section */}
              <div className="text-center mb-8">
                <img
                  id="appLogo"
                  onClick={handleRotate}
                  className="w-25 h-20 mx-auto rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 mb-1"
                  src={RESOURCES.LOGO}
                  alt="App Logo"
                  title="Click to rotate!"
                />
                <h1 className="text-2xl font-bold text-white mb-0">Welcome Back!</h1>
                <p className="text-white/80">Sign in to your account</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-400 rounded-lg text-red-200 text-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      name="email"
                      className={`${components.input.primary} pl-10`}
                      placeholder="Enter your email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      name="password"
                      className={`${components.input.primary} pl-10 pr-10`}
                      placeholder="Enter your password"
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

                {/* Submit Button */}
                <button
                  className={`${components.button.primary} w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <FiArrowRight />
                    </>
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center pt-4">
                  <p className="text-white/80">
                    New here?{" "}
                    <Link
                      to={ROUTES.REGISTER}
                      className="font-bold text-white hover:text-blue-200 transition-colors duration-200 underline"
                    >
                      Create Account
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

export default Login;
