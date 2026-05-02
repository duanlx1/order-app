import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value?: string;
  onChange: (base64: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSize = 800;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setPreview(compressedBase64);
        onChange(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    setPreview(urlInput);
    onChange(urlInput);
    setIsUrlMode(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-4 mb-2">
        <button
          type="button"
          onClick={() => setIsUrlMode(false)}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
            !isUrlMode ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
        >
          Tải ảnh lên
        </button>
        <button
          type="button"
          onClick={() => setIsUrlMode(true)}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
            isUrlMode ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
        >
          Dùng URL
        </button>
      </div>

      {isUrlMode ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-6 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
          >
            Áp dụng
          </button>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-gray-200 rounded-3xl p-8 hover:border-orange-400 hover:bg-orange-50/50 transition-all cursor-pointer text-center group"
        >
          {preview ? (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold text-sm">Đổi ảnh khác</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors">
                <Upload size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">Nhấn để tải ảnh lên</p>
                <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG (tối đa 5MB)</p>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
