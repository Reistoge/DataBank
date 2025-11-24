import { motion } from 'framer-motion';
import {
  FiUser,
  FiCalendar,
  FiMapPin,
  FiCreditCard,
  FiActivity,
  FiDollarSign,
  FiSettings,
  FiLock,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';
import type { TransactionSnapshot } from '../types/transaction.types';

// Define interface locally if not exported, or import from types
export interface TransactionHistoryItem {
  tx: {
    transactionId: string;
    status: string;
    createdAt: string;
    snapshot: string;
  };
  direction: string;
}

interface TransactionItemProps {
  item: TransactionHistoryItem;
  currentAccountNumber: string;
  index: number;
}

const parseSnapshot = (snapshotString: string): TransactionSnapshot | null => {
  try {
    return JSON.parse(snapshotString);
  } catch (error) {
    console.error('Failed to parse snapshot:', error);
    return null;
  }
};

const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
};

const formatDirection = (direction: string) => {
  if (direction.startsWith('OUT:')) {
    return {
      type: 'sent',
      otherParty: direction.replace('OUT: ', ''),
      icon: <FiTrendingDown className="text-red-500" />,
      colorClass: 'text-red-600',
    };
  } else {
    return {
      type: 'received',
      otherParty: direction.replace('GAIN: ', ''),
      icon: <FiTrendingUp className="text-green-500" />,
      colorClass: 'text-green-600',
    };
  }
};

export function TransactionItem({ item, currentAccountNumber, index }: TransactionItemProps) {
  if (!item?.tx || !item?.direction) return null;

  const { tx, direction } = item;
  const { transactionId, status, createdAt, snapshot: snapshotString } = tx;
  const snapshot = parseSnapshot(snapshotString);

  if (!snapshot || !snapshot.request) return null;

  const { request, fraudResult } = snapshot;
  const {
    amount,
    type,
    merchantCategory,
    location,
    description,
    device,
    currency,
  } = request;

  const { type: directionType, otherParty, icon, colorClass } = formatDirection(direction);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200 mb-3"
    >
      <div className="flex items-start justify-between">
        {/* Left side - Transaction details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <span className={`font-bold ${colorClass} text-lg`}>
              {directionType === 'sent' ? '-' : '+'}$
              {amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {status}
            </span>
            {fraudResult?.isFraud && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                ⚠️ FRAUD
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <FiUser className="text-xs" />
              <span className="font-medium">
                {directionType === 'sent' ? 'To:' : 'From:'}
              </span>
              <span className="text-gray-900">{otherParty}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <FiCalendar className="text-xs" />
              <span>{formatDate(createdAt)}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <FiMapPin className="text-xs" />
              <span>{location}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <FiCreditCard className="text-xs" />
              <span>{merchantCategory}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <FiActivity className="text-xs" />
              <span className="text-gray-900">{type}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <FiDollarSign className="text-xs" />
              <span>{currency}</span>
            </div>

            {device && (
              <div className="flex items-center gap-1 text-gray-600">
                <FiSettings className="text-xs" />
                <span>{device}</span>
              </div>
            )}

            {fraudResult && fraudResult.probabilitySuspicious > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <FiLock className="text-xs" />
                <span className="font-semibold">
                  Risk: {(fraudResult.probabilitySuspicious * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {description && (
            <p className="text-sm text-gray-600 mt-2 italic">"{description}"</p>
          )}

          {fraudResult?.behaviours && fraudResult.behaviours.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
              <p className="text-xs text-red-600 font-semibold mb-1">
                ⚠️ Suspicious Behaviours Detected:
              </p>
              <ul className="text-xs text-red-600 list-disc list-inside">
                {fraudResult.behaviours.map((behaviour, idx) => (
                  <li key={idx}>
                    {behaviour.description || behaviour.code}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right side - Transaction ID */}
        <div className="text-right ml-4">
          <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
          <p className="text-xs font-mono text-gray-700 bg-white px-2 py-1 rounded border">
            {transactionId.slice(0, 8)}...
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {fraudResult?.recommendation && (
              <span
                className={`px-2 py-1 rounded ${
                  fraudResult.recommendation === 'APPROVE'
                    ? 'bg-green-100 text-green-700'
                    : fraudResult.recommendation === 'REVIEW'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {fraudResult.recommendation}
              </span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}