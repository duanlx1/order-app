import React, { useState, useEffect } from 'react';
import { Ticket, X } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Voucher } from '../types';
import { toast } from 'sonner';

export default function VoucherInput() {
  const { appliedVoucher, setAppliedVoucher, getTotalPrice } = useCartStore();
  const [voucherCode, setVoucherCode] = useState(appliedVoucher?.code || '');
  const [voucherMsg, setVoucherMsg] = useState({ text: '', type: '' });

  const totalPrice = getTotalPrice();

  useEffect(() => {
    if (appliedVoucher) {
      setVoucherCode(appliedVoucher.code);
    }
  }, [appliedVoucher]);

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    
    try {
      const q = query(
        collection(db, 'vouchers'), 
        where('code', '==', voucherCode.toUpperCase()),
        where('isActive', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setVoucherMsg({ text: 'Mã giảm giá không tồn tại hoặc đã hết hạn!', type: 'error' });
        toast.error('Mã giảm giá không hợp lệ!');
        return;
      }

      const voucherData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Voucher;
      
      if (voucherData.expiryDate && voucherData.expiryDate < Date.now()) {
        setVoucherMsg({ text: 'Mã đã hết hạn sử dụng!', type: 'error' });
        toast.error('Mã đã hết hạn!');
        return;
      }

      if (voucherData.usageLimit && voucherData.usedCount >= voucherData.usageLimit) {
        setVoucherMsg({ text: 'Mã đã hết lượt sử dụng!', type: 'error' });
        toast.error('Mã đã hết lượt dùng!');
        return;
      }

      if (voucherData.minOrder && totalPrice < voucherData.minOrder) {
        setVoucherMsg({ text: `Đơn hàng tối thiểu ${voucherData.minOrder.toLocaleString('vi-VN')}₫ để áp dụng mã này!`, type: 'error' });
        toast.error('Chưa đủ điều kiện áp dụng!');
        return;
      }

      setAppliedVoucher(voucherData);
      setVoucherMsg({ text: 'Áp dụng mã thành công!', type: 'success' });
      toast.success(`Áp dụng mã ${voucherData.code} thành công`);
      
    } catch (error) {
      console.error('Voucher error:', error);
      setVoucherMsg({ text: 'Lỗi khi kiểm tra mã!', type: 'error' });
      toast.error('Lỗi hệ thống!');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Mã giảm giá (Voucher)</label>
      {appliedVoucher ? (
        <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <Ticket size={16} />
            <span className="font-bold">{appliedVoucher.code}</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              setAppliedVoucher(null);
              setVoucherCode('');
              setVoucherMsg({ text: '', type: '' });
            }}
            className="p-1 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Nhập mã..." 
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none"
            />
          </div>
          <button 
            type="button" 
            onClick={handleApplyVoucher}
            className="px-4 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-black transition-colors"
          >
            Áp dụng
          </button>
        </div>
      )}
      {voucherMsg.text && !appliedVoucher && (
        <p className={`text-[10px] pl-1 font-medium ${voucherMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {voucherMsg.text}
        </p>
      )}
    </div>
  );
}
