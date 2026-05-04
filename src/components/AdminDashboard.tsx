import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  Settings, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  Menu,
  ExternalLink,
  MapPin,
  Lock,
  Phone,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Save,
  Globe,
  Wallet,
  Ticket,
  Percent,
  Calendar,
  X,
  Users,
  UserPlus,
  ListTree
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  setDoc,
  getDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import ProductImage from './ProductImage';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';
import OrderDetail from './OrderDetail';
import { Category } from '../types';

interface Order {
  id: string;
  items: any[];
  totalPrice: number;
  status: string;
  createdAt: number;
  guestInfo?: {
    name: string;
    phone: string;
    address: string;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  isPublished: boolean;
}

interface Voucher {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  expiryDate?: number;
  createdAt?: number;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'vouchers' | 'settings' | 'users'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Category management states
  const [isEditingCategory, setIsEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // Product management states
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Voucher management states
  const [isEditingVoucher, setIsEditingVoucher] = useState<Voucher | null>(null);
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [deletingVoucherId, setDeletingVoucherId] = useState<string | null>(null);

  const isSuperAdmin = auth.currentUser?.email === 'xuanduan1905@gmail.com';

  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<any>(null);
  const [userHistoryOrders, setUserHistoryOrders] = useState<any[]>([]);
  const [isLoadingUserHistory, setIsLoadingUserHistory] = useState(false);
  const [adminActionConfirm, setAdminActionConfirm] = useState<{type: 'grant' | 'revoke', user: any} | null>(null);

  useEffect(() => {
    let unsubFallback: any = null;
    if (activeTab === 'users') {
      // Don't use orderBy here because existing users might not have the createdAt field, 
      // causing them to be silently dropped by Firestore.
      const q = query(collection(db, 'users'));
      const unsubUsers = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        // Manual sort
        data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setUsersList(data);
      }, (error) => {
        console.error("Failed to load users:", error);
        toast.error('Lỗi khi tải danh sách người dùng: ' + error.message);
      });

      const qAdmins = query(collection(db, 'admins'));
      const unsubAdmins = onSnapshot(qAdmins, (snapshot) => {
        setAdminList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubUsers();
        if (unsubFallback) unsubFallback();
        unsubAdmins();
      };
    }
  }, [activeTab]);

  const handleBlockUser = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'mở khóa' : 'khóa'} người dùng này?`)) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked: !currentStatus,
        updatedAt: Date.now()
      });
      toast.success(`Đã ${currentStatus ? 'mở khóa' : 'khóa'} tài khoản.`);
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  const loadUserHistory = async (userId: string) => {
    setIsLoadingUserHistory(true);
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setUserHistoryOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      // Missing index fallback
      try {
        const q2 = query(collection(db, 'orders'), where('userId', '==', userId));
        const snapshot = await getDocs(q2);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        orders.sort((a: any, b: any) => b.createdAt - a.createdAt);
        setUserHistoryOrders(orders);
      } catch (fallbackErr: any) {
        toast.error('Lỗi khi tải lịch sử: ' + fallbackErr.message);
      }
    } finally {
      setIsLoadingUserHistory(false);
    }
  };

  const handleViewUserHistory = (user: any) => {
    setSelectedUserForHistory(user);
    loadUserHistory(user.id);
  };

  const handleGrantAdmin = async (user: any) => {
    try {
      await setDoc(doc(db, 'admins', user.id), {
        email: user.email,
        name: user.name || '',
        grantedAt: Date.now()
      });
      toast.success('Đã cấp quyền admin thành công');
    } catch (err: any) {
      toast.error('Lỗi khi cấp quyền: ' + err.message);
    }
  };

  const handleRevokeAdmin = async (adminId: string) => {
    try {
      await deleteDoc(doc(db, 'admins', adminId));
      toast.success('Đã thu hồi quyền admin');
    } catch (err: any) {
      toast.error('Lỗi khi thu hồi quyền: ' + err.message);
    }
  };

  // Shop settings state
  const [shopSettings, setShopSettings] = useState({
    shopName: 'FoodieGo Store',
    address: '',
    phone: '',
    icon: '',
    bankAccount: '',
    bankName: '',
    paymentLink: ''
  });

  useEffect(() => {
    setLoading(true);
    
    // Listen to orders
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });

    // Listen to products
    const productsQuery = query(collection(db, 'products'), orderBy('category', 'asc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
    });

    // Fetch shop settings
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'shop'));
        if (settingsDoc.exists()) {
          setShopSettings(settingsDoc.data() as any);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/shop');
      }
    };
    fetchSettings();

    // Listen to vouchers
    const vouchersQuery = query(collection(db, 'vouchers'), orderBy('createdAt', 'desc'));
    const unsubscribeVouchers = onSnapshot(vouchersQuery, (snapshot) => {
      const vouchersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Voucher[];
      setVouchers(vouchersData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'vouchers');
    });

    // Listen to categories
    const categoriesQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const catsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(catsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'categories');
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeVouchers();
      unsubscribeCategories();
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: Date.now()
      });
      toast.success('Cập nhật trạng thái thành công');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'In-Progress': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'Ready': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Shipping': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Success': return 'bg-green-100 text-green-600 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={14} />;
      case 'In-Progress': return <AlertCircle size={14} />;
      case 'Ready': return <Package size={14} />;
      case 'Shipping': return <Truck size={14} />;
      case 'Success': return <CheckCircle2 size={14} />;
      case 'Cancelled': return <X size={14} />;
      default: return null;
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (isEditingProduct) {
        await updateDoc(doc(db, 'products', isEditingProduct.id), {
          ...productData,
          updatedAt: Date.now()
        });
        toast.success('Đã cập nhật món ăn');
        setIsEditingProduct(null);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          isPublished: true,
          createdAt: Date.now()
        });
        toast.success('Đã thêm món ăn mới');
        setIsAddingProduct(false);
      }
    } catch (err) {
      toast.error('Lỗi khi lưu món ăn');
      handleFirestoreError(err, isEditingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      toast.success('Đã xóa món ăn');
      setDeletingProductId(null);
      if (isEditingProduct?.id === productId) {
        setIsEditingProduct(null);
      }
    } catch (err) {
      toast.error('Lỗi khi xóa món ăn');
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    const nextStatus = !product.isPublished;
    try {
      await updateDoc(doc(db, 'products', product.id), {
        isPublished: nextStatus
      });
      toast.success(nextStatus ? 'Đã hiển thị sản phẩm' : 'Đã ẩn sản phẩm');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryData = {
      name: formData.get('name') as string,
      order: Number(formData.get('order'))
    };

    try {
      if (isEditingCategory) {
        await updateDoc(doc(db, 'categories', isEditingCategory.id), categoryData);
        toast.success('Đã cập nhật danh mục');
        setIsEditingCategory(null);
      } else {
        await addDoc(collection(db, 'categories'), categoryData);
        toast.success('Đã thêm danh mục mới');
        setIsAddingCategory(false);
      }
    } catch (err) {
      toast.error('Lỗi khi lưu danh mục');
      handleFirestoreError(err, isEditingCategory ? OperationType.UPDATE : OperationType.CREATE, 'categories');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      toast.success('Đã xóa danh mục');
      setDeletingCategoryId(null);
      if (isEditingCategory?.id === categoryId) {
        setIsEditingCategory(null);
      }
    } catch (err) {
      toast.error('Lỗi khi xóa danh mục');
      handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
    }
  };

  const handleSaveVoucher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const voucherData = {
      code: formData.get('code') as string,
      type: formData.get('type') as 'percentage' | 'fixed',
      value: Number(formData.get('value')),
      minOrder: Number(formData.get('minOrder')) || 0,
      usageLimit: Number(formData.get('usageLimit')) || null,
      expiryDate: formData.get('expiryDate') ? new Date(formData.get('expiryDate') as string).getTime() : null,
      isActive: true,
      updatedAt: Date.now()
    };

    try {
      if (isEditingVoucher) {
        await updateDoc(doc(db, 'vouchers', isEditingVoucher.id), voucherData);
        toast.success('Đã cập nhật mã giảm giá');
        setIsEditingVoucher(null);
      } else {
        await addDoc(collection(db, 'vouchers'), {
          ...voucherData,
          usedCount: 0,
          createdAt: Date.now()
        });
        toast.success('Đã thêm mã giảm giá mới');
        setIsAddingVoucher(false);
      }
    } catch (err) {
      toast.error('Lỗi khi lưu mã giảm giá');
      handleFirestoreError(err, isEditingVoucher ? OperationType.UPDATE : OperationType.CREATE, 'vouchers');
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    try {
      await deleteDoc(doc(db, 'vouchers', voucherId));
      toast.success('Đã xóa mã giảm giá');
      setDeletingVoucherId(null);
      if (isEditingVoucher?.id === voucherId) {
        setIsEditingVoucher(null);
      }
    } catch (err) {
      toast.error('Lỗi khi xóa mã giảm giá');
      handleFirestoreError(err, OperationType.DELETE, `vouchers/${voucherId}`);
    }
  };

  const toggleVoucherStatus = async (voucher: Voucher) => {
    const nextStatus = !voucher.isActive;
    try {
      await updateDoc(doc(db, 'vouchers', voucher.id), {
        isActive: nextStatus
      });
      toast.success(nextStatus ? 'Đã kích hoạt mã' : 'Đã tạm dừng mã');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
      handleFirestoreError(err, OperationType.UPDATE, `vouchers/${voucher.id}`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'shop'), {
        ...shopSettings,
        updatedAt: Date.now()
      });
      toast.success('Đã lưu cấu hình cửa hàng');
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình');
      handleFirestoreError(err, OperationType.WRITE, 'settings/shop');
    }
  };

  if (error && error.includes('permissions')) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <Lock size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">Quyền truy cập bị từ chối</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Bạn cần đăng nhập bằng tài khoản Quản trị viên để truy cập hệ thống này. 
          Vui lòng quay lại trang chủ và đăng nhập bằng email: <span className="font-bold text-gray-900">xuanduan1905@gmail.com</span>
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
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Responsive */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tighter text-orange-500">FOODIEGO <span className="text-[10px] text-white/50 font-mono">ADMIN</span></h1>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white/10 text-orange-400 font-black' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <BarChart3 size={18} />
            Đơn hàng
          </button>
          <button 
            onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white/10 text-orange-400 font-black' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <Package size={18} />
            Sản phẩm
          </button>
          <button 
            onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-white/10 text-orange-400 font-black' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <ListTree size={18} />
            Danh mục
          </button>
          <button 
            onClick={() => { setActiveTab('vouchers'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'vouchers' ? 'bg-white/10 text-orange-400 font-black' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <Ticket size={18} />
            Mã giảm giá
          </button>
          <button 
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white/10 text-orange-400 font-black' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <Settings size={18} />
            Cấu hình
          </button>
          <button 
            onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white/10 text-orange-400 font-black' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <Users size={18} />
            Người dùng
          </button>
        </nav>
        <div className="p-4 border-t border-white/5">
           <button 
             onClick={onBack}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-gray-500 hover:text-white transition-colors"
           >
             <ChevronLeft size={14} />
             Quay lại Cửa hàng
           </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4 lg:p-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-gray-900 uppercase">
                {activeTab === 'orders' ? 'Hệ thống xử lý đơn' : 
                 activeTab === 'products' ? 'Quản lý sản phẩm' : 
                 activeTab === 'categories' ? 'Quản lý danh mục' : 
                 activeTab === 'vouchers' ? 'Quản lý Voucher' : 
                 activeTab === 'users' ? 'Quản lý Người Dùng' : 'Cấu hình cửa hàng'}
              </h2>
              <p className="hidden sm:block text-xs text-gray-500 font-medium tracking-wide">
                {activeTab === 'orders' ? 'Trạng thái thời gian thực' : 
                 activeTab === 'products' ? 'Danh sách món ăn của bạn' : 
                 activeTab === 'categories' ? 'Phân loại thực đơn' : 
                 activeTab === 'vouchers' ? 'Chương trình khuyến mãi' : 
                 activeTab === 'users' ? 'Khách hàng & Doanh thu' : 'Thông tin chung & Thanh toán'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'products' && !isEditingProduct && !isAddingProduct && (
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
              >
                <Plus size={16} />
                Thêm món mới
              </button>
            )}

            {activeTab === 'categories' && !isEditingCategory && !isAddingCategory && (
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
              >
                <Plus size={16} />
                Thêm danh mục
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-gray-900">Quản trị viên</p>
               <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">● Online</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold shadow-sm shrink-0 overflow-hidden">
               {shopSettings.icon ? (
                 <img src={shopSettings.icon || undefined} alt="" className="w-full h-full object-cover" />
               ) : 'A'}
             </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deletingProductId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDeletingProductId(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl max-w-sm w-full text-center"
                >
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight">Xác nhận xóa món?</h3>
                  <p className="text-sm text-gray-500 font-medium mb-8">
                    Hành động này không thể hoàn tác. Món ăn này sẽ bị gỡ bỏ vĩnh viễn khỏi menu.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setDeletingProductId(null)}
                      className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(deletingProductId)}
                      className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                      Xóa ngay
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
            
            {deletingCategoryId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDeletingCategoryId(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl max-w-sm w-full text-center"
                >
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight">Xác nhận xóa danh mục?</h3>
                  <p className="text-sm text-gray-500 font-medium mb-8">
                    Hành động này không thể hoàn tác. Danh mục này sẽ bị gỡ bỏ vĩnh viễn.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setDeletingCategoryId(null)}
                      className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(deletingCategoryId)}
                      className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                      Xóa ngay
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {deletingVoucherId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDeletingVoucherId(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl max-w-sm w-full text-center"
                >
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight">Xác nhận xóa mã?</h3>
                  <p className="text-sm text-gray-500 font-medium mb-8">
                    Mã giảm giá này sẽ bị gỡ bỏ vĩnh viễn và không thể áp dụng cho các đơn hàng mới.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setDeletingVoucherId(null)}
                      className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={() => handleDeleteVoucher(deletingVoucherId)}
                      className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                      Xóa ngay
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-20">
              <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold">Đang đồng bộ dữ liệu...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'orders' && (
                <motion.div 
                  key="orders"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          <th className="p-5 pl-8">Mã đơn / Thời gian</th>
                          <th className="p-5">Khách hàng / Thông tin</th>
                          <th className="p-5">Danh sách món ăn</th>
                          <th className="p-5">Trạng thái</th>
                          <th className="p-5 text-right">Tổng tiền</th>
                          <th className="p-5 text-right pr-8">Thao tác xử lý</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                          <motion.tr 
                            key={order.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="p-4 lg:p-5 pl-4 lg:pl-8">
                              <div className="flex flex-col">
                                <button 
                                  onClick={() => setSelectedOrder(order)} 
                                  className="text-[13px] lg:text-sm font-black text-orange-600 hover:text-orange-700 hover:underline leading-none mb-1.5 uppercase tracking-tighter text-left transition-colors cursor-pointer"
                                >
                                  #{order.id.slice(-6).toUpperCase()}
                                </button>
                                <div className="space-y-0.5">
                                  <span className="flex items-center gap-1 text-[9px] lg:text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                    <Clock size={10} strokeWidth={3} />
                                    {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="text-[8px] lg:text-[9px] text-gray-400 font-medium whitespace-nowrap hidden sm:block">
                                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 lg:p-5 max-w-[180px] lg:max-w-[240px]">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 leading-tight truncate">{order.guestInfo?.name || 'Khách vãng lai'}</span>
                                <span className="text-[9px] lg:text-[10px] text-orange-600 font-black mb-1.5 flex items-center gap-1">
                                  <Phone size={10} strokeWidth={3} />
                                  {order.guestInfo?.phone}
                                </span>
                                <div className="bg-gray-100/50 p-2 rounded-lg flex items-start gap-1.5 hover:bg-gray-100 transition-colors cursor-help border border-transparent">
                                  <MapPin size={10} className="mt-0.5 text-gray-400 shrink-0" />
                                  <span className="text-[9px] lg:text-[10px] text-gray-500 leading-tight font-medium line-clamp-2 italic">
                                    {order.guestInfo?.address}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 lg:p-5 min-w-[180px]">
                              <div className="flex flex-col gap-2">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 group/item">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm shrink-0">
                                      <ProductImage 
                                        src={item.image} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-115" 
                                      />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] lg:text-[11px] font-black text-gray-900 leading-tight mb-0.5 truncate max-w-[120px] lg:max-w-[180px]">
                                        {item.name}
                                      </span>
                                      <span className="text-[9px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <span className="text-orange-600 font-black">×{item.quantity}</span>
                                        <span className="text-[8px] lg:text-[9px]">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 lg:p-5">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full border text-[9px] lg:text-[10px] font-black uppercase tracking-wider shadow-sm ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="whitespace-nowrap">
                                  {order.status === 'Pending' ? 'Mới đặt' : 
                                   order.status === 'In-Progress' ? 'Đã xác nhận' :
                                   order.status === 'Ready' ? 'Sẵn sàng' :
                                   order.status === 'Shipping' ? 'Đang giao' :
                                   order.status === 'Cancelled' ? 'Đã hủy' : 'Đã giao'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 lg:p-5 text-right font-black text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                              {order.totalPrice.toLocaleString('vi-VN')}₫
                            </td>
                            <td className="p-4 lg:p-5 text-right pr-4 lg:pr-8">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap w-[150px]">
                                 {order.status === 'Pending' && (
                                   <button 
                                     onClick={() => updateOrderStatus(order.id, 'In-Progress')}
                                     className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-purple-700 transition-all shadow-md shadow-purple-100 flex items-center gap-1.5"
                                   >
                                     <CheckCircle2 size={12} />
                                     Xác nhận
                                   </button>
                                 )}
                                 {order.status === 'In-Progress' && (
                                   <button 
                                     onClick={() => updateOrderStatus(order.id, 'Ready')}
                                     className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-1.5"
                                   >
                                     <Package size={12} />
                                     Xong món
                                   </button>
                                 )}
                                 {order.status === 'Ready' && (
                                   <button 
                                     onClick={() => updateOrderStatus(order.id, 'Shipping')}
                                     className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-orange-700 transition-all shadow-md shadow-orange-100 flex items-center gap-1.5"
                                   >
                                     <Truck size={12} />
                                     Giao hàng
                                   </button>
                                 )}
                                 {order.status === 'Shipping' && (
                                   <button 
                                     onClick={() => updateOrderStatus(order.id, 'Success')}
                                     className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-green-700 transition-all shadow-md shadow-green-100 flex items-center gap-1.5"
                                   >
                                     <CheckCircle2 size={12} />
                                     Đã giao
                                   </button>
                                 )}
                                 {['Pending', 'In-Progress', 'Ready'].includes(order.status) && (
                                    <button 
                                      onClick={() => {
                                        toast('Bạn có chắc chắn muốn hủy đơn hàng này không?', {
                                          action: {
                                            label: 'Xác nhận hủy',
                                            onClick: () => updateOrderStatus(order.id, 'Cancelled')
                                          },
                                          cancel: {
                                            label: 'Đóng',
                                            onClick: () => {}
                                          }
                                        });
                                      }}
                                      className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase hover:bg-red-200 transition-all flex items-center gap-1.5"
                                    >
                                      <X size={12} />
                                      Hủy
                                    </button>
                                 )}
                                 {order.status === 'Success' && (
                                   <div className="flex items-center gap-1 text-green-600 font-bold text-[10px] uppercase bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                     <CheckCircle2 size={12} />
                                     Hoàn tất
                                   </div>
                                 )}
                                 {order.status === 'Cancelled' && (
                                   <div className="flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                     <X size={12} />
                                     Đã hủy
                                   </div>
                                 )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-20 text-center text-gray-400 font-bold">
                              Chưa có đơn hàng nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'products' && (
                <motion.div 
                  key="products"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {(isEditingProduct || isAddingProduct) ? (
                    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl max-w-2xl mx-auto">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black uppercase text-gray-900">
                          {isAddingProduct ? 'Thêm món ăn mới' : 'Chỉnh sửa món ăn'}
                        </h3>
                        <button 
                          onClick={() => { setIsEditingProduct(null); setIsAddingProduct(false); }}
                          className="text-gray-400 hover:text-gray-900"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                      
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const productData = {
                          name: formData.get('name') as string,
                          price: Number(formData.get('price')),
                          category: formData.get('category') as string,
                          description: formData.get('description') as string,
                          image: formData.get('image') as string,
                        };
                        handleSaveProduct(productData);
                      }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Tên món ăn</label>
                            <input 
                              name="name"
                              defaultValue={isEditingProduct?.name}
                              required
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              placeholder="Ví dụ: Cơm Tấm Sườn Bì Chả"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Giá bán (₫)</label>
                            <input 
                              name="price"
                              type="number"
                              defaultValue={isEditingProduct?.price}
                              required
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              placeholder="45000"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Danh mục</label>
                            <select 
                              name="category"
                              defaultValue={isEditingProduct?.category || (categories[0]?.name ?? '')}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none appearance-none"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Hình ảnh món ăn</label>
                          <input type="hidden" name="image" id="productImageInput" defaultValue={isEditingProduct?.image || ''} />
                          <ImageUploader 
                            value={isEditingProduct?.image} 
                            onChange={(val) => {
                              const hiddenInput = document.getElementById('productImageInput') as HTMLInputElement;
                              if (hiddenInput) hiddenInput.value = val;
                            }} 
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Mô tả chi tiết</label>
                          <textarea 
                            name="description"
                            defaultValue={isEditingProduct?.description}
                            rows={4}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none resize-none"
                            placeholder="Mô tả thành phần, hương vị..."
                          />
                        </div>

                        <div className="flex gap-4">
                          <button 
                            type="submit"
                            className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all flex items-center justify-center gap-2"
                          >
                            <Save size={18} />
                            {isAddingProduct ? 'Tạo món ăn' : 'Lưu thay đổi'}
                          </button>
                          
                          {isEditingProduct && (
                            <button 
                              type="button"
                              onClick={() => {
                                setDeletingProductId(isEditingProduct.id);
                              }}
                              className="px-6 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                              <th className="p-5 pl-8">Thông tin món</th>
                              <th className="p-5">Danh mục</th>
                              <th className="p-5">Đơn giá</th>
                              <th className="p-5">Trạng thái</th>
                              <th className="p-5 text-right pr-8">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {products.map((product) => (
                              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 pl-8">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shrink-0">
                                      <ProductImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-gray-900 mb-1">{product.name}</p>
                                      <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{product.description}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    {product.category}
                                  </span>
                                </td>
                                <td className="p-4 text-sm font-black text-gray-900">
                                  {product.price.toLocaleString('vi-VN')}₫
                                </td>
                                <td className="p-4">
                                  <button 
                                    onClick={() => toggleProductStatus(product)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                      product.isPublished 
                                      ? 'bg-green-50 text-green-600 border-green-100' 
                                      : 'bg-gray-100 text-gray-400 border-gray-200'
                                    }`}
                                  >
                                    {product.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                                    {product.isPublished ? 'Đang bán' : 'Ẩn'}
                                  </button>
                                </td>
                                <td className="p-4 text-right pr-8">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => setIsEditingProduct(product)}
                                      className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => setDeletingProductId(product.id)}
                                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'categories' && (
                <motion.div 
                  key="categories"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {(isEditingCategory || isAddingCategory) ? (
                    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl max-w-2xl mx-auto">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black uppercase text-gray-900">
                          {isAddingCategory ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                        </h3>
                        <button 
                          onClick={() => { setIsEditingCategory(null); setIsAddingCategory(false); }}
                          className="text-gray-400 hover:text-gray-900"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                      
                      <form onSubmit={handleSaveCategory} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Tên danh mục</label>
                            <input 
                              name="name"
                              defaultValue={isEditingCategory?.name}
                              required
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              placeholder="Ví dụ: Món chính"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Thứ tự hiển thị</label>
                            <input 
                              name="order"
                              type="number"
                              defaultValue={isEditingCategory?.order ?? 99}
                              required
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              placeholder="1"
                            />
                            <p className="mt-2 text-xs text-gray-400 font-medium">Số nhỏ sẽ hiển thị trước.</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button 
                            type="submit"
                            className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all flex items-center justify-center gap-2"
                          >
                            <Save size={18} />
                            {isAddingCategory ? 'Tạo danh mục' : 'Lưu thay đổi'}
                          </button>
                          
                          {isEditingCategory && (
                            <button 
                              type="button"
                              onClick={() => {
                                setDeletingCategoryId(isEditingCategory.id);
                              }}
                              className="px-6 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                              <th className="p-5 pl-8">Tên danh mục</th>
                              <th className="p-5">Thứ tự</th>
                              <th className="p-5 text-right pr-8">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {categories.map((category) => (
                              <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 pl-8">
                                  <p className="text-sm font-black text-gray-900">{category.name}</p>
                                </td>
                                <td className="p-4 text-sm font-black text-gray-900">
                                  {category.order}
                                </td>
                                <td className="p-4 text-right pr-8">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => setIsEditingCategory(category)}
                                      className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => setDeletingCategoryId(category.id)}
                                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {categories.length === 0 && (
                               <tr>
                                 <td colSpan={3} className="p-8 text-center text-gray-400 font-medium italic">
                                   Chưa có danh mục nào. Hãy thêm mới!
                                 </td>
                               </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'vouchers' && (
                <motion.div 
                  key="vouchers"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Mã giảm giá</h2>
                  <p className="text-gray-500 font-medium">Thiết lập các chương trình khuyến mãi cho khách hàng</p>
                </div>
                {(isAddingVoucher || isEditingVoucher) ? (
                  <button 
                    onClick={() => { setIsAddingVoucher(false); setIsEditingVoucher(null); }}
                    className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Quay lại danh sách
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsAddingVoucher(true)}
                    className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-gray-200"
                  >
                    <Plus size={18} />
                    Thêm mã mới
                  </button>
                )}
              </div>

              {(isAddingVoucher || isEditingVoucher) ? (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
                    <form onSubmit={handleSaveVoucher} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Mã giảm giá (Code)</label>
                          <input 
                            name="code"
                            defaultValue={isEditingVoucher?.code}
                            required
                            placeholder="Ưu đãi: GIAM20K"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Loại giảm giá</label>
                          <select 
                            name="type"
                            defaultValue={isEditingVoucher?.type || 'fixed'}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                          >
                            <option value="fixed">Giảm theo số tiền (₫)</option>
                            <option value="percentage">Giảm theo phần trăm (%)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Giá trị giảm</label>
                          <div className="relative">
                            <input 
                              type="number"
                              name="value"
                              defaultValue={isEditingVoucher?.value}
                              required
                              placeholder="20000 hoặc 10"
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Đơn tối thiểu (₫)</label>
                          <input 
                            type="number"
                            name="minOrder"
                            defaultValue={isEditingVoucher?.minOrder}
                            placeholder="0"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Giới hạn lượt dùng</label>
                          <input 
                            type="number"
                            name="usageLimit"
                            defaultValue={isEditingVoucher?.usageLimit}
                            placeholder="Để trống nếu không giới hạn"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Ngày hết hạn</label>
                          <input 
                            type="date"
                            name="expiryDate"
                            defaultValue={isEditingVoucher?.expiryDate ? new Date(isEditingVoucher.expiryDate).toISOString().split('T')[0] : ''}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button 
                          type="submit"
                          className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all flex items-center justify-center gap-2"
                        >
                          <Save size={18} />
                          {isAddingVoucher ? 'Tạo mã voucher' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {vouchers.map((voucher) => (
                    <motion.div 
                      key={voucher.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 relative group hover:border-orange-200 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${voucher.isActive ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                          <Ticket size={24} />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsEditingVoucher(voucher)}
                            className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-900 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeletingVoucherId(voucher.id)}
                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1">{voucher.code}</h3>
                        <div className="flex items-center gap-2 text-sm font-bold text-orange-600">
                          {voucher.type === 'percentage' ? (
                            <><Percent size={14} /> <span>Giảm {voucher.value}%</span></>
                          ) : (
                            <><Wallet size={14} /> <span>Giảm {voucher.value.toLocaleString('vi-VN')}₫</span></>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                          <BarChart3 size={12} />
                          <span>Đã dùng: {voucher.usedCount} {voucher.usageLimit ? `/ ${voucher.usageLimit}` : ''}</span>
                        </div>
                        {voucher.minOrder && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                            <Package size={12} />
                            <span>Đơn tối thiểu: {voucher.minOrder.toLocaleString('vi-VN')}₫</span>
                          </div>
                        )}
                        {voucher.expiryDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                            <Calendar size={12} />
                            <span>Hết hạn: {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => toggleVoucherStatus(voucher)}
                        className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                          voucher.isActive 
                            ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {voucher.isActive ? 'Đang hoạt động' : 'Đang tạm dừng'}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              )}

              {vouchers.length === 0 && !isAddingVoucher && !isEditingVoucher && (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket size={32} />
                      </div>
                      <p className="text-gray-400 font-bold">Chưa có mã giảm giá nào</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
                    <form onSubmit={handleSaveSettings} className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">
                            <Globe size={14} className="text-orange-500" />
                            Thông tin hiển thị
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 px-1">Tên cửa hàng</label>
                              <input 
                                value={shopSettings.shopName}
                                onChange={(e) => setShopSettings({...shopSettings, shopName: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 px-1">Địa chỉ</label>
                              <input 
                                value={shopSettings.address}
                                onChange={(e) => setShopSettings({...shopSettings, address: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 px-1">Số điện thoại</label>
                              <input 
                                value={shopSettings.phone}
                                onChange={(e) => setShopSettings({...shopSettings, phone: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 px-1">Icon/Logo Cửa hàng</label>
                              <ImageUploader 
                                value={shopSettings.icon} 
                                onChange={(val) => setShopSettings({...shopSettings, icon: val})} 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">
                            <Wallet size={14} className="text-orange-500" />
                            Thông tin thanh toán
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 px-1">Số tài khoản</label>
                              <input 
                                value={shopSettings.bankAccount}
                                onChange={(e) => setShopSettings({...shopSettings, bankAccount: e.target.value})}
                                placeholder="Ví dụ: 123456789"
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 px-1">Ngân hàng</label>
                              <input 
                                value={shopSettings.bankName}
                                onChange={(e) => setShopSettings({...shopSettings, bankName: e.target.value})}
                                placeholder="Ví dụ: Techcombank"
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 px-1">Link Thanh toán (QR)</label>
                              <input 
                                value={shopSettings.paymentLink}
                                onChange={(e) => setShopSettings({...shopSettings, paymentLink: e.target.value})}
                                placeholder="Link Zalopay, MoMo hoặc QR code"
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                              />
                            </div>
                          </div>

                          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                             <p className="text-[10px] text-orange-700 font-bold leading-relaxed">
                               Thông tin này sẽ hiển thị ở bước thanh toán để khách hàng có thể chuyển khoản trực tiếp cho cửa hàng.
                             </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                        <button 
                          type="submit"
                          className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                        >
                          <Save size={18} />
                          Lưu tất cả thay đổi
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
              {activeTab === 'users' && (
                <motion.div 
                  key="users"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <input 
                      type="text" 
                      placeholder="Tìm theo tên hoặc email..." 
                      value={searchUserQuery}
                      onChange={(e) => setSearchUserQuery(e.target.value)}
                      className="bg-white border text-sm font-medium border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500/20 max-w-sm w-full"
                    />
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Người dùng</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Tham gia</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Sức mua</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Phân quyền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 uppercase text-xs font-bold leading-relaxed">
                          {usersList
                            .filter(u => `${u.name||''} ${u.email||''}`.toLowerCase().includes(searchUserQuery.toLowerCase()))
                            .map((u) => {
                              const isAdmin = adminList.some(a => a.id === u.id);
                              return (
                                <tr key={u.id} className={`group hover:bg-gray-50 transition-colors ${u.isBlocked ? 'opacity-50 grayscale' : ''}`}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div 
                                      className="flex items-center gap-3 cursor-pointer group/name"
                                      onClick={() => handleViewUserHistory(u)}
                                    >
                                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-gray-900 group-hover/name:text-orange-600 transition-colors">{u.name || 'Chưa cập nhật'}</p>
                                        <p className="text-[10px] text-gray-400 tracking-wider lowercase">{u.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="text-gray-900">{u.totalOrders || 0} Đơn</p>
                                    <p className="text-[10px] text-green-600 tracking-wider">{(u.totalSpent || 0).toLocaleString()} ₫</p>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <button 
                                      onClick={() => handleBlockUser(u.id, !!u.isBlocked)}
                                      className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-full ${
                                        u.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                      }`}
                                    >
                                      {u.isBlocked ? 'Đang Khóa' : 'Hoạt động'}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {isSuperAdmin ? (
                                      <button 
                                        onClick={() => setAdminActionConfirm({ type: isAdmin ? 'revoke' : 'grant', user: u })}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${
                                          isAdmin ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                      >
                                        {isAdmin ? 'Admin' : 'Cấp quyền'}
                                      </button>
                                    ) : (
                                      <span className="text-gray-400 font-bold uppercase text-[10px]">{isAdmin ? 'Admin' : 'Khách'}</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <AnimatePresence>
            {adminActionConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
                onClick={() => setAdminActionConfirm(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl relative overflow-hidden p-6 text-center"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">
                    {adminActionConfirm.type === 'grant' ? 'Cấp quyền Admin?' : 'Thu hồi quyền Admin?'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-8 font-medium">
                    Bạn có chắc chắn muốn {adminActionConfirm.type === 'grant' ? 'cấp quyền quản trị viên cửa hàng cho' : 'thu hồi quyền của'} người dùng <span className="font-bold text-gray-900">{adminActionConfirm.user.email}</span> không?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAdminActionConfirm(null)}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={() => {
                        if (adminActionConfirm.type === 'grant') {
                          handleGrantAdmin(adminActionConfirm.user);
                        } else {
                          handleRevokeAdmin(adminActionConfirm.user.id);
                        }
                        setAdminActionConfirm(null);
                      }}
                      className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-orange-700 transition-colors shadow-md shadow-orange-200"
                    >
                      Đồng ý
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedUserForHistory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
                onClick={() => setSelectedUserForHistory(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xl">
                        {(selectedUserForHistory.name || selectedUserForHistory.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900 leading-tight">Lịch sử của {selectedUserForHistory.name || 'Người dùng'}</h2>
                        <p className="text-sm font-medium text-gray-500">{selectedUserForHistory.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedUserForHistory(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {isLoadingUserHistory ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-gray-500 text-sm">Đang tải lịch sử đơn hàng...</p>
                      </div>
                    ) : userHistoryOrders.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="font-bold text-gray-400">Người dùng này chưa có đơn hàng nào.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {userHistoryOrders.map(order => (
                          <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between gap-4 sm:items-center hover:border-orange-200 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order as Order)}>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-black text-gray-900 uppercase text-sm tracking-wider">#{order.id.slice(0, 6)}</span>
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                  order.status === 'Success' ? 'bg-green-100 text-green-700' :
                                  order.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {order.status === 'Success' ? 'Hoàn thành' : order.status === 'Pending' ? 'Chờ xác nhận' : 'Đang xử lý'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 font-medium">
                                {new Date(order.createdAt).toLocaleString('vi-VN')} • {order.items?.length || 0} món
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-black text-lg text-gray-900">{(order.totalPrice || 0).toLocaleString()} ₫</p>
                              <p className="text-[10px] uppercase font-bold text-orange-500 tracking-wider group-hover:underline">Xem chi tiết &rarr;</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedOrder && (
              <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} isAdmin={true} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
