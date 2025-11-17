export interface Product {
  name: string;
  description: string;
  price: number;
  quantity: number;
  sku: string;
  category: string;
  isActive: boolean;
  merchantName: string;
}

export interface Merchant {
  name: string;
  category: string;
  description?: string;
  location?: string;
  isActive: boolean;
  email: string;
  contact: string;
  accountNumber: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface PaymentState {
  step: 'products' | 'cart' | 'checkout' | 'processing' | 'success' | 'error';
  selectedProducts: CartItem[];
  totalAmount: number;
  error?: string;
}
export interface CreatePaymentDto {

  cardNumber: string;
  cvv: number;
  password: string;
  merchantName: string;
  location: string
  currency: string
  device: string
  ipAddress: string
  product: Product;
  expiryDate: string;

}
