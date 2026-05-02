import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product, Addon } from '../types';
import { useCartStore } from '../store/useCartStore';
import ProductImage from './ProductImage';
import { toast } from 'sonner';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const addItem = useCartStore((state) => state.addItem);

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) => 
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const totalPrice = (product.price + selectedAddons.reduce((sum, a) => sum + a.price, 0)) * quantity;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedAddons);
    toast.success(`Đã thêm ${quantity} món vào giỏ hàng`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <X size={20} />
        </button>

        <div className="w-full md:w-1/2 aspect-square md:aspect-auto">
          <ProductImage 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="mb-6">
            <span className="text-orange-600 font-bold text-xs uppercase tracking-wider mb-2 block">{product.category}</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded text-orange-600 text-sm">
                <Star size={14} fill="currentColor" />
                <span className="font-bold">{product.rating}</span>
              </div>
              <span className="text-gray-400 text-sm">({product.reviewCount} đánh giá)</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          </div>

          {product.addons && product.addons.length > 0 && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                Tùy chọn thêm
                <span className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Không bắt buộc</span>
              </h4>
              <div className="space-y-3">
                {product.addons.map((addon) => (
                  <label 
                    key={addon.id}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddons.find(a => a.id === addon.id) 
                        ? 'border-orange-500 bg-orange-50/50' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedAddons.find(a => a.id === addon.id) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                      }`}>
                        {selectedAddons.find(a => a.id === addon.id) && <Plus size={14} className="text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${selectedAddons.find(a => a.id === addon.id) ? 'text-orange-900' : 'text-gray-700'}`}>
                        {addon.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">+{addon.price.toLocaleString('vi-VN')}₫</span>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      onChange={() => toggleAddon(addon)}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-white rounded-lg transition-all text-gray-600 disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus size={18} />
                </button>
                <span className="font-bold text-lg w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-white rounded-lg transition-all text-gray-600"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs mb-1">Tổng cộng</p>
                <p className="text-2xl font-black text-orange-600">{totalPrice.toLocaleString('vi-VN')}₫</p>
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-3 bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-[0.98]"
            >
              <ShoppingCart size={22} />
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
