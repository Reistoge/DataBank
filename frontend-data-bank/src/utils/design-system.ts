import type { IconType } from 'react-icons';

// Color palette
export const colors = {
  gradients: {
    primary: 'bg-gradient-to-br from-slate-900 via-sky-700 to-blue-500',
    card: 'bg-gradient-to-r from-blue-300 to-sky-400',
    success: 'bg-gradient-to-br from-green-400 via-emerald-500 to-blue-600',
    danger: 'bg-gradient-to-r from-red-500 via-pink-500 to-orange-500',
    warning: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500',
  },
  glass: {
    light: 'bg-white/10 backdrop-blur-sm border border-white/20',
    medium: 'bg-white/20 backdrop-blur-md border border-white/30',
    dark: 'bg-black/20 backdrop-blur-sm border border-black/20',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    accent: 'text-blue-400',
    muted: 'text-gray-500',
  }
};

// Component styles
export const components = {
  button: {
    primary: 'bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105',
    secondary: 'bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg border border-white/30 transition-all duration-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
    success: 'bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
  },
  input: {
    primary: 'w-full rounded-lg p-3 bg-white/90 text-black font-medium border-2 border-transparent hover:border-white/50 focus:outline-none focus:border-white focus:bg-white transition-all duration-200',
    glass: 'w-full p-3 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200',
  },
  card: {
    primary: 'bg-white rounded-xl shadow-2xl p-6',
    glass: 'bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 shadow-xl',
    gradient: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-2xl',
  }
};

// Animation presets
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  scale: 'hover:scale-105 transition-transform duration-200',
  glow: 'hover:shadow-lg hover:shadow-blue-500/25 transition-shadow duration-300',
};