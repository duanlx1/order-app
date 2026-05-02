import { create } from 'zustand';
import { CartItem, Product, Addon, Voucher } from '../types';

interface CartState {
  items: CartItem[];
  appliedVoucher: Voucher | null;
  addItem: (product: Product, quantity: number, selectedAddons: Addon[]) => void;
  removeItem: (productId: string, selectedAddons: Addon[]) => void;
  updateQuantity: (productId: string, selectedAddons: Addon[], quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  setAppliedVoucher: (voucher: Voucher | null) => void;
  getDiscountAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  appliedVoucher: null,
  addItem: (product, quantity, selectedAddons) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => 
          item.id === product.id && 
          JSON.stringify(item.selectedAddons) === JSON.stringify(selectedAddons)
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id && 
            JSON.stringify(item.selectedAddons) === JSON.stringify(selectedAddons)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { ...product, quantity, selectedAddons }],
      };
    });
  },
  removeItem: (productId, selectedAddons) => {
    set((state) => ({
      items: state.items.filter(
        (item) => 
          item.id !== productId || 
          JSON.stringify(item.selectedAddons) !== JSON.stringify(selectedAddons)
      ),
    }));
  },
  updateQuantity: (productId, selectedAddons, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId && 
        JSON.stringify(item.selectedAddons) === JSON.stringify(selectedAddons)
          ? { ...item, quantity }
          : item
      ),
    }));
  },
  clearCart: () => set({ items: [], appliedVoucher: null }),
  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      const addonsTotal = item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      return total + (item.price + addonsTotal) * item.quantity;
    }, 0);
  },
  setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),
  getDiscountAmount: () => {
    const { appliedVoucher, getTotalPrice } = get();
    if (!appliedVoucher) return 0;
    const totalPrice = getTotalPrice();
    if (appliedVoucher.minOrder && totalPrice < appliedVoucher.minOrder) return 0;
    
    let amount = 0;
    if (appliedVoucher.type === 'percentage') {
      amount = (totalPrice * appliedVoucher.value) / 100;
      if (appliedVoucher.maxDiscount && amount > appliedVoucher.maxDiscount) {
        amount = appliedVoucher.maxDiscount;
      }
    } else {
      amount = appliedVoucher.value;
    }
    return amount;
  },
}));
