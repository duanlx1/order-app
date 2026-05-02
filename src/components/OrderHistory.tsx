import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  History,
  X
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import ProductImage from './ProductImage';
import { Order } from '../types';
import { toast } from 'sonner';
import OrderDetail from './OrderDetail';

interface OrderHistoryProps {
  onBack: () => void;
}

export default function OrderHistory({ onBack }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching order history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'In-Progress': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'Ready': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Shipping': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Success': return 'text-green-600 bg-green-50 border-green-100';
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={14} />;
      case 'In-Progress': return <CheckCircle2 size={14} />;
      case 'Ready': return <Package size={14} />;
      case 'Shipping': return <Truck size={14} />;
      case 'Success': return <CheckCircle2 size={14} />;
      case 'Cancelled': return <X size={14} />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending': return 'Đã nhận đơn';
      case 'In-Progress': return 'Đang xử lý';
      case 'Ready': return 'Chuẩn bị xong';
      case 'Shipping': return 'Đang giao hàng';
      case 'Success': return 'Giao hàng thành công';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    toast('Bạn có chắc chắn muốn hủy đơn hàng này không?', {
      action: {
        label: 'Xác nhận hủy',
        onClick: async () => {
          try {
            await updateDoc(doc(db, 'orders', orderId), {
              status: 'Cancelled',
              updatedAt: Date.now()
            });
            toast.success('Đã hủy đơn hàng');
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
            toast.error('Lỗi khi hủy đơn hàng');
          }
        }
      },
      cancel: {
        label: 'Đóng',
        onClick: () => {}
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
          <History size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">Lịch sử đơn hàng</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Vui lòng đăng nhập để xem lịch sử và trạng thái các đơn hàng bạn đã đặt.
        </p>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center gap-2"
        >
          <ChevronLeft size={20} />
          Quay lại Cửa hàng
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-5 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-900"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Đơn hàng của tôi</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Lịch sử & Trạng thái</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-30">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold">Đang tải lịch sử đơn...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-32 text-center">
            <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={48} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
              Bạn chưa thực hiện đơn hàng nào. Hãy khám phá menu và đặt món ngay nhé!
            </p>
            <button 
              onClick={onBack}
              className="px-6 py-3 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
            >
              Đặt món ngay
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-gray-900 font-mono tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mb-1">Tổng cộng</p>
                      <p className="text-lg font-black text-gray-900 tracking-tighter">
                        {order.totalPrice.toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                          <ProductImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-500">x{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[10px] text-gray-400 font-bold uppercase pl-13">+ {order.items.length - 2} món khác</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-[10px] text-gray-500 font-medium line-clamp-1 italic max-w-[200px]">
                        {order.guestInfo?.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {order.status === 'Pending' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                          className="flex items-center gap-1 text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors"
                        >
                          <X size={14} /> Hủy đơn
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase tracking-widest group-hover:gap-2 transition-all"
                      >
                        Chi tiết <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
