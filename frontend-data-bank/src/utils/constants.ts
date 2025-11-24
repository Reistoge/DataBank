// API Configuration
export const API_BASE_URL = 'http://localhost:5000/api';  // Changed from 6000 to 5000

// Route Constants
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADD_ACCOUNT: '/addAccount',
  ADD_CARD: '/addCard',
  DELETE_ACCOUNT: '/deleteAccount',
  DELETE_CARD: '/deleteCard',
  ADMIN_PANEL: '/adminPanel',
  TRANSFER: '/transfer',
  SHOP_PAYMENT: '/shop-payment',
  PAYMENT: '/payment',
  MY_CARDS: '/my-cards', 
  CONTACTS: '/contacts', 
  TRANSFER_CONTACT: '/transfer-contact',

  HOME: '/',
} as const;


// API Endpoint Routes
export const API_REQUEST_ROUTE = Object.freeze({
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  LOGOUT: '/auth/logout',
} as const);



// Resource URLs
export const RESOURCES = Object.freeze({
  LOGO: '/DBO-W.png',
  LOGO_B: '/DBO-B.png',
  VITE_LOGO: '/vite.svg',
  WARNING: 'https://icons.veryicon.com/png/o/photographic/ant-design-official-icon-library/warning-circle.png://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.veryicon.com%2Ficons%2Fphotographic%2Fant-design-official-icon-library%2Fwarning-circle.html&psig=AOvVaw3dedn0n-bz4OdPgFYlr52r&ust=1758893099542000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCKDkv8SB9I8DFQAAAAAdAAAAABAE',
  VITE_WARNING: '/vite.svg',
  GO_BACK: 'https://www.svgrepo.com/show/114939/go-back-arrow.svg',
  VITE_BACK: '/vite.svg',
} as const);

export const ACCOUNT_ROUTES = Object.freeze({
  CREATE_ACCOUNT: '/account', // req token
  GET_ACCOUNTS: '/account/myAccounts', // req token
  DELETE_ACCOUNT: '/account', // req token
  UPDATE_ACCOUNT: '/account/updateAccount'


})
export const ADMIN_ROUTES = Object.freeze({ 
  FIND_ALL_ACCOUNTS :'/account/findAll'


})
export const TRANSACTION_ROUTES = Object.freeze({ 
  TRANSACTION:'/transaction',
  MAKE_TRANSACTION :'/transaction',
  HISTORY :'/history'


})
export const CARD_ROUTES = Object.freeze({
  CREATE_CARD: '/card', // req token
  GET_CARDS: '/card/myCards', // req token
  UPDATE_CARD: '/card/updateCard', // req token
  DELETE_CARD: '/card'

})
export const USER_ROUTES = Object.freeze({
  GET_PROFILE: '/api/auth/profile', // req token
  ADD_CONTACT: '/users/contacts', 
  UPDATE_CONTACT: '/users/contacts', 
  GET_CONTACTS: '/users/contacts', 


})

// HTTP Status Codes
export const HTTP_STATUS = Object.freeze({
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const);

// Storage Keys
export const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme_preference',
} as const);

// Validation Constants
export const VALIDATION = Object.freeze({
  MIN_PASSWORD_LENGTH: 6,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const);

// Application Configuration
export const APP_CONFIG = Object.freeze({
  NAME: 'DataBank',
  VERSION: '1.0.0',
  AUTHOR: 'Ferran Rojas',
  GITHUB: 'https://github.com/Reistoge',
} as const);

// Animation Constants
export const ANIMATION = Object.freeze({
  ROTATION_DEGREES: 360,
  TRANSITION_DURATION: '1s',
  TRANSITION_EASING: 'ease-in-out',
} as const);

// Type exports for better TypeScript support
export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];
export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type ApiEndpoint = typeof API_REQUEST_ROUTE[keyof typeof API_REQUEST_ROUTE];