import { motion } from 'framer-motion';
import { FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi';
import type { CartItem, Product } from '../types/payment.types';
import { components } from '../utils/design-system';

interface ProductCardProps {
  product: Product;
  cartItem?: CartItem;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  isInCart: boolean;
}

function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onUpdateQuantity,
  isInCart,
}: ProductCardProps) {
  const handleIncrement = () => {
    if (cartItem && cartItem.cartQuantity < product.quantity) {
      onUpdateQuantity(product._id, cartItem.cartQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (cartItem && cartItem.cartQuantity > 1) {
      onUpdateQuantity(product._id, cartItem.cartQuantity - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`${components.card.glass} overflow-hidden cursor-pointer transition-all duration-300 flex flex-col h-full`}
    >
      {/* Product Image Placeholder */}
      <div className="w-full h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center mb-4">
        <div className="text-5xl opacity-20">📦</div>
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Category and Stock */}
        <div className="flex justify-between items-center mb-3 text-xs">
          <span className="bg-blue-500/30 text-blue-200 px-2 py-1 rounded">
            {product.category}
          </span>
          <span className="text-gray-400">
            Stock: {product.quantity}
          </span>
        </div>

        {/* Price */}
        <div className="mb-4 flex-1">
          <p className="text-2xl font-bold text-white mb-1">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
        </div>

        {/* Action Buttons */}
        {!isInCart ? (
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FiShoppingCart />
            Add to Cart
          </button>
        ) : (
          <div className="flex gap-2 items-center bg-white/10 rounded-lg p-2">
            <button
              onClick={handleDecrement}
              disabled={cartItem!.cartQuantity <= 1}
              className="flex-1 bg-red-500/50 hover:bg-red-500/70 disabled:opacity-50 text-white p-2 rounded transition-colors duration-200 flex items-center justify-center"
            >
              <FiMinus />
            </button>
            <span className="flex-1 text-center font-bold text-white">
              {cartItem?.cartQuantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={cartItem!.cartQuantity >= product.quantity}
              className="flex-1 bg-green-500/50 hover:bg-green-500/70 disabled:opacity-50 text-white p-2 rounded transition-colors duration-200 flex items-center justify-center"
            >
              <FiPlus />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ProductCard;