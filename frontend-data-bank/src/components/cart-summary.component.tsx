import { motion } from 'framer-motion';
import { FiTrash2, FiShoppingBag } from 'react-icons/fi';
import type { CartItem } from '../types/payment.types';
import { PaymentService } from '../services/payment.service';
import { components } from '../utils/design-system';

interface CartSummaryProps {
  items: CartItem[];
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

function CartSummary({
  items,
  onRemoveItem,
  onCheckout,
  isLoading,
}: CartSummaryProps) {
  const total = PaymentService.calculateTotal(items);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${components.card.gradient} sticky top-6 h-fit`}
    >
      <div className="flex items-center gap-2 mb-6">
        <FiShoppingBag className="text-2xl text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Order Summary</h2>
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No items in cart</p>
        ) : (
          items.map((item) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 rounded-lg p-3 flex justify-between items-center"
            >
              <div className="flex-1">
                <p className="text-white font-semibold text-sm line-clamp-1">
                  {item.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {item.cartQuantity} x ${item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold min-w-[60px] text-right">
                  ${(item.price * item.cartQuantity).toFixed(2)}
                </span>
                <button
                  onClick={() => onRemoveItem(item.name)}
                  className="p-2 bg-red-500/50 hover:bg-red-500/70 text-white rounded transition-colors duration-200"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/20 my-4" />

      {/* Total */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-300">Subtotal</span>
          <span className="text-white font-semibold">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Tax (0%)</span>
          <span className="text-white font-semibold">$0.00</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="text-white font-bold">Total</span>
          <span className="text-green-400 font-bold text-2xl">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={items.length === 0 || isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
      >
        {isLoading ? 'Processing...' : 'Proceed to Checkout'}
      </button>
    </motion.div>
  );
}

export default CartSummary;