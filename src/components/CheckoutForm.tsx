import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, User, MapPin, CreditCard, ChevronLeft, CheckCircle2, Truck, Wallet, ExternalLink, AlertCircle } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ProductImage from './ProductImage';
import { toast } from 'sonner';

interface CheckoutFormProps {
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

import { createOrder } from '../services/orderService';
import VoucherInput from './VoucherInput';

export default function CheckoutForm({ onBack, onSuccess }: CheckoutFormProps) {
  const { items, getTotalPrice, clearCart, appliedVoucher, getDiscountAmount } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cod'
  });
  const [shopSettings, setShopSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'shop'));
        if (settingsDoc.exists()) {
          setShopSettings(settingsDoc.data());
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);
  const [phoneError, setPhoneError] = useState('');
  const [shippingEstimate, setShippingEstimate] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const cacheRef = React.useRef<Record<string, any[]>>({});
  const lastErrorTimeRef = React.useRef<number>(0);

  const totalPrice = getTotalPrice();
  const discountAmount = getDiscountAmount();

  const handleAddressSearch = (query: string) => {
    setFormData({ ...formData, address: query });
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if we recently got a 429 (cooldown 30s)
    const now = Date.now();
    if (now - lastErrorTimeRef.current < 30000) {
      return;
    }

    if (query.trim().length > 5) {
      // Check client-side cache first
      if (cacheRef.current[query.trim()]) {
        setSuggestions(cacheRef.current[query.trim()]);
        setShowSuggestions(true);
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await axios.get(`/api/geocoding/search?q=${encodeURIComponent(query.trim())}`);
          setSuggestions(res.data);
          setShowSuggestions(true);
          // Cache results
          cacheRef.current[query.trim()] = res.data;
        } catch (e: any) {
          if (e.response?.status === 429) {
            lastErrorTimeRef.current = Date.now();
          }
          setSuggestions([]);
        }
      }, 1000); // 1s debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: any) => {
    setFormData({ ...formData, address: s.display_name });
    setSuggestions([]);
    setShowSuggestions(false);
    handleEstimateShipping();
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Số điện thoại không hợp lệ (VD: 0901234567)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleEstimateShipping = async () => {
    if (formData.address.length > 10) {
      try {
        const res = await axios.post('/api/shipping/estimate', {
          destination: formData.address
        });
        setShippingEstimate(res.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(formData.phone)) {
      return;
    }

    setLoading(true);
    
    try {
      const orderId = await createOrder({
        guestInfo: formData,
        items,
        totalPrice: Math.max(0, totalPrice + (shippingEstimate?.estimate || 15000) - discountAmount),
        shippingFee: shippingEstimate?.estimate || 15000,
        ...(appliedVoucher && { voucher: appliedVoucher })
      });

      if (orderId) {
        // Hồi đáp từ Backend (Optional)
        await axios.post('/api/orders', { id: orderId });
        
        clearCart();
        toast.success('Đặt hàng thành công!');
        onSuccess(orderId);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8 group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Tiếp tục mua sắm
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Thanh toán</h2>
            <p className="text-gray-500">Hoàn tất một vài bước cuối cùng để nhận món ngon!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">1</span>
                Thông tin người nhận
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 pl-1">Họ và tên</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      required
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 pl-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${phoneError ? 'text-red-400' : 'text-gray-400'}`} />
                    <input 
                      required
                      type="tel" 
                      placeholder="0901234567" 
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({...formData, phone: e.target.value});
                        if (phoneError) validatePhone(e.target.value);
                      }}
                      onBlur={(e) => validatePhone(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-2xl text-sm focus:ring-2 outline-none transition-all ${
                        phoneError 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:ring-orange-500'
                      }`}
                    />
                  </div>
                  {phoneError && <p className="text-[10px] text-red-500 pl-1 font-medium">{phoneError}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">2</span>
                Địa chỉ giao hàng
              </h3>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  required
                  type="text" 
                  placeholder="Nhập địa chỉ của bạn..." 
                  value={formData.address}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  onBlur={() => {
                    // Trì hoãn việc ẩn để kịp click chọn gợi ý
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="w-full pl-10 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
                />

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectSuggestion(s)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 last:border-none flex items-start gap-3 transition-colors"
                        >
                          <MapPin size={14} className="mt-1 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-600 line-clamp-2">{s.display_name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {shippingEstimate && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100"
                >
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <Truck size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Grab Express</p>
                    <p className="text-[10px] text-blue-700">Dự kiến giao trong {shippingEstimate.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-900">{shippingEstimate.estimate.toLocaleString('vi-VN')}₫</p>
                  </div>
                </motion.div>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">3</span>
                Phương thức thanh toán
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                }`}>
                  <CreditCard size={24} className={formData.paymentMethod === 'cod' ? 'text-orange-600' : 'text-gray-400'} />
                  <span className="text-xs font-bold mt-2">Tiền mặt (COD)</span>
                  <input 
                    type="radio" 
                    name="payment" 
                    className="hidden" 
                    onChange={() => setFormData({...formData, paymentMethod: 'cod'})}
                    checked={formData.paymentMethod === 'cod'}
                  />
                </label>
                <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.paymentMethod === 'transfer' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                }`}>
                  <Wallet size={24} className={formData.paymentMethod === 'transfer' ? 'text-orange-600' : 'text-gray-400'} />
                  <span className="text-xs font-bold mt-2">Chuyển khoản</span>
                  <input 
                    type="radio" 
                    name="payment" 
                    className="hidden" 
                    onChange={() => setFormData({...formData, paymentMethod: 'transfer'})}
                    checked={formData.paymentMethod === 'transfer'}
                  />
                </label>
              </div>

              <AnimatePresence>
                {formData.paymentMethod === 'transfer' && shopSettings?.bankAccount && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none">Số tài khoản</p>
                          <p className="text-lg font-black text-gray-900 tracking-tight">{shopSettings.bankAccount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none">Ngân hàng</p>
                          <p className="text-sm font-black text-orange-600">{shopSettings.bankName}</p>
                        </div>
                      </div>
                      
                      {shopSettings.paymentLink && (
                        <a 
                          href={shopSettings.paymentLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <ExternalLink size={14} />
                          Quét mã QR / Link thanh toán
                        </a>
                      )}

                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                        <AlertCircle size={14} className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-blue-800 leading-relaxed italic">
                          Vui lòng chuyển khoản đúng số tiền khớp với tổng đơn hàng. Đơn hàng sẽ được xử lý ngay sau khi nhận được thông báo chuyển khoản.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <button 
              type="submit"
              disabled={loading || !formData.name || !formData.phone || !formData.address}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 size={24} />
                  Xác nhận đặt hàng
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-3xl p-6 sticky top-24">
            <h4 className="font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Tóm tắt đơn hàng</h4>
            <div className="space-y-5 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                    <ProductImage src={item.image} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[11px] font-black text-gray-800 leading-snug mb-1">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-widest">
                        x{item.quantity}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        {item.price.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <VoucherInput />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tạm tính</span>
                <span className="font-medium text-gray-900">{totalPrice.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Phí giao hàng</span>
                <span className="font-medium text-gray-900">{(shippingEstimate?.estimate || 15000).toLocaleString('vi-VN')}₫</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá</span>
                  <span className="font-bold">-{discountAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
                <span className="font-bold text-gray-900 uppercase text-xs tracking-wider">Tổng cộng</span>
                <span className="text-2xl font-black text-orange-600">
                  {Math.max(0, totalPrice + (shippingEstimate?.estimate || 15000) - discountAmount).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
