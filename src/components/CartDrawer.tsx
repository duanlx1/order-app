import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, MapPin, Ticket, CreditCard, ChevronRight, Truck, ShoppingCart, Minus, Plus } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import ProductImage from './ProductImage';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Voucher } from '../types';
import { toast } from 'sonner';

import VoucherInput from './VoucherInput';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, getDiscountAmount } = useCartStore();
  const [shippingFee] = useState(15000); // Mặc định

  const totalPrice = getTotalPrice();
  const discount = getDiscountAmount();
  const finalTotal = Math.max(0, totalPrice + shippingFee - discount);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[70]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[80] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl font-bold flex items-center justify-center">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Giỏ hàng của bạn</h2>
                  <p className="text-xs text-gray-400">{items.length} món đã chọn</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={40} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Chưa có món nào ở đây!</p>
                  <p className="text-xs max-w-[200px] mt-2">Dạo một vòng cửa hàng để tìm món bạn thích nhé.</p>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative border border-gray-100">
                      <ProductImage 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                        <button 
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn bỏ món này khỏi giỏ hàng?')) {
                              removeItem(item.id, item.selectedAddons);
                            }
                          }}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {item.selectedAddons.length > 0 && (
                        <p className="text-[10px] text-gray-400 mb-2 italic">
                          Thêm: {item.selectedAddons.map(a => a.name).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg">
                          <button 
                            onClick={() => updateQuantity(item.id, item.selectedAddons, Math.max(1, item.quantity - 1))}
                            className="text-gray-400 hover:text-orange-600 disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.selectedAddons, item.quantity + 1)}
                            className="text-gray-400 hover:text-orange-600"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          {((item.price + item.selectedAddons.reduce((s, a) => s + a.price, 0)) * item.quantity).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-gray-50 space-y-4">
                <VoucherInput />

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tạm tính</span>
                    <span className="font-medium text-gray-900">{totalPrice.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">Phí giao hàng <Truck size={14} className="text-blue-500" /></span>
                    <span className="font-medium text-gray-900">{shippingFee.toLocaleString('vi-VN')}₫</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá</span>
                      <span className="font-bold">-{discount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Tổng cộng</span>
                      <span className="text-2xl font-black text-orange-600 leading-none">{finalTotal.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <button 
                      onClick={onCheckout}
                      className="flex items-center gap-2 bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 group"
                    >
                      Thanh toán
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
