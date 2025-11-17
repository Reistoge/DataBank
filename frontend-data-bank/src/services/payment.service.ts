import type { CartItem, Merchant, Product } from '../types/payment.types';
import type { CardResponse } from './dto/account.types';

// Helper function to format the date
const formatExpiryDate = (date: any): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    // Pad with '0' if month is single digit
    const month = ('0' + (d.getMonth() + 1)).slice(-2); 
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${year}`;
  } catch (error) {
    console.error("Could not format expiry date:", date);
    // If it's already a string like "MM/YY", return it directly
    if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}$/)) {
      return date;
    }
    return '';
  }
};

export class PaymentService {
  static calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.price * item.cartQuantity, 0);
  }

  static validateCart(items: CartItem[]): { valid: boolean; error?: string } {
    if (items.length === 0) {
      return { valid: false, error: 'Cart is empty' };
    }

    for (const item of items) {
      if (item.cartQuantity <= 0) {
        return { valid: false, error: `Invalid quantity for ${item.name}` };
      }
      if (item.cartQuantity > item.quantity) {
        return { valid: false, error: `Insufficient stock for ${item.name}` };
      }
    }

    return { valid: true };
  }

  static buildPaymentRequest(
    product: CartItem,
    card: CardResponse,
    merchant: Merchant,
    paymentData: {
      password: any;
      location: string;
      currency: string;
      device: string;
      ipAddress: string;
    },
  ) {
    // Create a product object without the 'cartQuantity' property for the payload
    const productPayload: Product = {
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.cartQuantity,  
      sku: product.sku,
      category: product.category,
      isActive: product.isActive,
      merchantName: product.merchantName,
    };

    return {
      cardNumber: card.number,
      cvv: card.cvv,
      expiryDate: formatExpiryDate(card.expiryDate), // Use the formatted date here
      password: paymentData.password,
      merchantName: merchant.name,
      location: paymentData.location,
      currency: paymentData.currency,
      device: paymentData.device,
      ipAddress: paymentData.ipAddress,
      product: productPayload,
    };
  }
}