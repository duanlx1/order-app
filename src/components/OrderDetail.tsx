import { motion } from 'framer-motion';
import { X, MapPin, Phone, Package, Clock, Tag, AlertCircle, CheckCircle2, Truck } from 'lucide-react';
import { Order } from '../types';
import ProductImage from './ProductImage';

interface OrderDetailProps {
  order: Order;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function OrderDetail({ order, onClose, isAdmin }: OrderDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'In-Progress': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'Ready': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Shipping': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Success': return 'bg-green-100 text-green-600 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={16} />;
      case 'In-Progress': return <AlertCircle size={16} />;
      case 'Ready': return <Package size={16} />;
      case 'Shipping': return <Truck size={16} />;
      case 'Success': return <CheckCircle2 size={16} />;
      case 'Cancelled': return <X size={16} />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending': return 'Mới đặt';
      case 'In-Progress': return 'Đang xử lý';
      case 'Ready': return 'Chuẩn bị xong';
      case 'Shipping': return 'Đang giao hàng';
      case 'Success': return 'Giao thành công';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const subtotal = order.items.reduce((sum, item) => {
    const itemTotal = item.price + (item.selectedAddons?.reduce((a, b) => a + b.price, 0) || 0);
    return sum + (itemTotal * item.quantity);
  }, 0);
  const discount = order.voucher ? (order.voucher.type === 'percentage' ? (subtotal * order.voucher.value) / 100 : order.voucher.value) : 0;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Chi tiết đơn hàng</h2>
            <p className="text-sm font-mono text-gray-500">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 text-gray-500 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Header Status */}
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-sm ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{getStatusLabel(order.status)}</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Thông tin người nhận</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <span className="font-bold">{order.guestInfo?.name?.charAt(0) || 'K'}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{order.guestInfo?.name || 'Khách vãng lai'}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <Phone size={12} />
                  {order.guestInfo?.phone}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-3 border-t border-gray-200/60">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                {order.guestInfo?.address}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Danh sách món ăn</h4>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-gray-100 overflow-hidden shrink-0 shadow-sm bg-gray-50">
                    <ProductImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <h5 className="text-sm font-bold text-gray-900 leading-tight">{item.name}</h5>
                      <span className="text-sm font-black text-gray-900 whitespace-nowrap">
                        {((item.price + (item.selectedAddons?.reduce((a: any, b: any) => a + b.price, 0) || 0)) * item.quantity).toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    <div className="text-xs text-orange-600 font-black mb-1">x{item.quantity}</div>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="text-[11px] text-gray-500 font-medium space-y-0.5">
                        {item.selectedAddons.map((addon: any, i: number) => (
                          <div key={i} className="flex items-center gap-1">
                            <span>+ {addon.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tạm tính</span>
              <span className="font-bold text-gray-900">{subtotal.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí giao hàng</span>
              <span className="font-bold text-gray-900">{order.shippingFee.toLocaleString('vi-VN')}₫</span>
            </div>
            {order.voucher && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag size={14} /> Voucher ({order.voucher.code})
                </span>
                <span className="font-bold">-{discount.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
              <span className="font-black text-gray-900 uppercase text-xs tracking-wider">Tổng cộng</span>
              <span className="text-2xl font-black text-orange-600 leading-none">
                {order.totalPrice.toLocaleString('vi-VN')}₫
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
