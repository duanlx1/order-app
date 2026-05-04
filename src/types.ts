export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  addons?: Addon[];
  rating: number;
  reviewCount: number;
  isPublished?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedAddons: Addon[];
}

export interface Voucher {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  expiryDate?: number;
  createdAt?: number;
}

export interface Order {
  id: string;
  userId?: string;
  guestInfo?: {
    name: string;
    phone: string;
    address: string;
  };
  items: CartItem[];
  totalPrice: number;
  shippingFee: number;
  voucher?: Voucher;
  status: 'Pending' | 'In-Progress' | 'Ready' | 'Shipping' | 'Success' | 'Cancelled';
  createdAt: number;
  grabId?: string;
}
