import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className = "" }: ProductImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-4 ${className}`}>
        <ImageOff size={24} strokeWidth={1.5} className="mb-2 opacity-50" />
        <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">Không có ảnh</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
}
