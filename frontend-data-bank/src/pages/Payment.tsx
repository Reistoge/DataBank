import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSend,
  FiArrowLeft,
  FiLock,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiDollarSign,
  FiUser,
  FiMail,
  FiMapPin,
  FiCreditCard,
  FiInfo,
} from 'react-icons/fi';
import displayAccountResponseComponent from '../components/display-account.component';
import { useAuth } from '../hooks/useAuth.hook';
import { getUserAccounts, transaction } from '../services/api.service';
import type { AccountResponse } from '../services/dto/account.types';
import { ROUTES, ANIMATION, RESOURCES } from '../utils/constants';
import { colors, components } from '../utils/design-system';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import type {
  TransactionRequest,
  StartTransactionResponse,
} from '../types/transaction.types';

type FormState = 'form' | 'submit' | 'success' | 'error';

const TRANSACTION_TYPES = [
  'PAYMENT',
  'TRANSFER',
  'PURCHASE',
  'WITHDRAWAL',
  'DEPOSIT',
] as const;

const MERCHANT_CATEGORIES = [
  'GROCERIES',
  'ENTERTAINMENT',
  'UTILITIES',
  'HEALTHCARE',
  'TRANSPORTATION',
  'DINING',
  'SHOPPING',
  'OTHER',
] as const;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CLP'] as const;

const DEVICES = ['web-browser', 'mobile-app', 'tablet', 'desktop'] as const;

function Payment() {
 
}

export default Payment;
