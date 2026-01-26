export interface Product {
  id: string;
  name: string;
  price: number;
  promoPrice?: number; // Preço promocional opcional
  description: string;
  image: string;
  category: string;
  features: string[];
  stock: number;
  active: boolean; // Se o produto aparece na loja ou não
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  total: number;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  items: CartItem[];
  created_at: string;
  notes?: string;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}