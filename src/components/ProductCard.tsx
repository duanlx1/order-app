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
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ProductImage 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-700">
          {product.category}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-1 bg-orange-50 px-1.5 py-0.5 rounded text-orange-600">
            <Star size={12} fill="currentColor" />
            <span className="text-[11px] font-bold">{product.rating}</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs line-clamp-2 mb-4 h-8">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-gray-900 leading-none">
            {product.price.toLocaleString('vi-VN')}₫
          </span>
          <button className="p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all transform active:scale-95">
            <Plus size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
