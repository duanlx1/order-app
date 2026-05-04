import { motion } from 'motion/react';
import { Star, Plus } from 'lucide-react';
import { Product } from '../types';
import ProductImage from './ProductImage';

interface ProductCardProps {
  key?: string;
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex flex-row sm:flex-col"
      onClick={onClick}
    >
      <div className="relative w-[33%] sm:w-full aspect-square sm:aspect-[4/3] shrink-0 overflow-hidden">
        <ProductImage 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-700">
          {product.category}
        </div>
      </div>
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1 sm:mb-2 gap-2">
            <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 sm:line-clamp-1 text-sm sm:text-base leading-tight">{product.name}</h3>
            <div className="flex items-center gap-1 bg-orange-50 px-1.5 py-0.5 rounded text-orange-600 shrink-0">
              <Star size={12} fill="currentColor" />
              <span className="text-[10px] sm:text-[11px] font-bold">{product.rating}</span>
            </div>
          </div>
          <p className="text-gray-500 text-[11px] sm:text-xs line-clamp-2 mb-2 sm:mb-4">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-base sm:text-lg text-gray-900 leading-none">
            {product.price.toLocaleString('vi-VN')}₫
          </span>
          <button className="p-1.5 sm:p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all transform active:scale-95">
            <Plus size={16} className="sm:hidden" />
            <Plus size={20} className="hidden sm:block" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
