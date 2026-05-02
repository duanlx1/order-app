import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import CheckoutForm from './components/CheckoutForm';
import { CATEGORIES } from './constants';
import { Product } from './types';
import { Utensils, Clock, ThumbsUp, ShieldCheck, CheckCircle2, ChevronRight, Phone, MapPin } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

import AdminDashboard from './components/AdminDashboard';
import OrderHistory from './components/OrderHistory';

type View = 'menu' | 'checkout' | 'success' | 'admin' | 'history';

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [activeCategory, setActiveCategory] = useState("Phổ biến");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderId, setOrderId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [shopSettings, setShopSettings] = useState({
    shopName: 'FoodieGo Store',
    address: '',
    phone: '',
    icon: '',
  });

  useEffect(() => {
    // Listen to published products
    const q = query(collection(db, 'products'), where('isPublished', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    }, (err) => {
      console.error('Error fetching products:', err);
    });

    // Listen to shop settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'shop'), (doc) => {
      if (doc.exists()) {
        setShopSettings(doc.data() as any);
      }
    }, (err) => {
      console.error('Error fetching settings:', err);
    });

    return () => {
      unsubscribe();
      unsubscribeSettings();
    };
  }, []);

  const handleCheckout = () => {
    setIsCartOpen(false);
    setView('checkout');
  };

  const handleOrderSuccess = (id: string) => {
    setOrderId(id);
    setView('success');
  };

  if (view === 'admin') {
    return (
      <>
        <AdminDashboard onBack={() => setView('menu')} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (view === 'history') {
    return (
      <>
        <OrderHistory onBack={() => setView('menu')} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-orange-100 selection:text-orange-900 flex flex-col">
      <Navbar 
        onCartClick={() => setIsCartOpen(true)} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onHistoryClick={() => setView('history')}
        shopIcon={shopSettings.icon}
        shopName={shopSettings.shopName}
      />

      <main className="flex-1 pb-24">
        {view === 'menu' && (
          <>
            {/* Hero Section */}
            <header className="relative bg-orange-600 pt-16 pb-32 px-4 overflow-hidden">
               <div className="absolute inset-0 opacity-10">
                 <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,1),transparent)]"></div>
               </div>
               <div className="max-w-7xl mx-auto relative z-10 text-center">
                 <motion.h2 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-white text-5xl md:text-7xl font-black mb-6 tracking-tight uppercase"
                 >
                   {shopSettings.shopName.split(' ').map((word, i) => (
                     <span key={i}>{word} {i === 0 && <br className="md:hidden" />} </span>
                   ))}
                 </motion.h2>
                 <motion.p 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="text-orange-100 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10"
                 >
                   Hương vị đỉnh cao, giao hàng siêu tốc chỉ trong 25 phút.
                 </motion.p>
                 <div className="flex flex-wrap justify-center gap-4">
                   <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-bold border border-white/20">
                     <Clock size={20} className="text-orange-300" />
                     Giao nhanh 25'
                   </div>
                   <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-bold border border-white/20">
                     <ThumbsUp size={20} className="text-orange-300" />
                     Chất lượng 5*
                   </div>
                 </div>
               </div>
            </header>

            {/* Categories & Menu */}
            <section className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-orange-900/5 p-8 md:p-12 border border-gray-100">
                <div className="flex items-center justify-between mb-12 flex-wrap gap-6">
                  <div className="flex gap-3 overflow-x-auto pb-4 md:pb-0 scrollbar-hide no-scrollbar">
                    {CATEGORIES.map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                          activeCategory === cat 
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl">
                    <Utensils size={14} className="text-orange-500" />
                    {products.length} món sẵn sàng
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {products.filter(p => {
                    const matchesCategory = activeCategory === "Phổ biến" || p.category === activeCategory;
                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                       p.description.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                  }).map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
                {products.filter(p => {
                  const matchesCategory = activeCategory === "Phổ biến" || p.category === activeCategory;
                  const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                     p.description.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesCategory && matchesSearch;
                }).length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-gray-400 font-medium italic">Hiện chưa có món ăn nào trong danh mục này.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {view === 'checkout' && (
          <CheckoutForm 
            onBack={() => setView('menu')}
            onSuccess={handleOrderSuccess}
          />
        )}

        {view === 'success' && (
          <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 max-w-lg w-full text-center"
            >
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Đặt hàng thành công!</h2>
              <p className="text-gray-500 mb-2 font-medium">Cảm ơn bạn đã tin tưởng {shopSettings.shopName}.</p>
              <div className="bg-gray-50 inline-block px-4 py-2 rounded-xl font-mono text-sm text-gray-600 mb-8 border border-gray-100">
                Mã đơn: <span className="font-bold text-gray-900">{orderId}</span>
              </div>
              
              <div className="space-y-4 mb-10 text-left bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-900">Đơn hàng đã được xác nhận</p>
                    <p className="text-[10px] text-orange-700">Nhà hàng đang chuẩn bị món ăn của bạn.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Grab Express đang đến</p>
                    <p className="text-[10px] text-gray-500">Shipper sẽ nhận món sau 10-15 phút.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setView('menu')}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 group"
              >
                Tiếp tục mua sắm
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        )}
      </main>

      <footer className="hidden lg:block bg-gray-50 py-8 lg:py-12 border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-8">
            <div className="text-center lg:text-left max-w-sm">
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">{shopSettings.shopName}</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2 justify-center lg:justify-start">
                  <MapPin size={14} className="text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{shopSettings.address || 'Đang cập nhật địa chỉ'}</p>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <Phone size={14} className="text-orange-500 shrink-0" />
                  <p className="text-xs text-gray-500 font-medium">{shopSettings.phone || 'Đang cập nhật SĐT'}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Hương vị của sự tận tâm</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 w-full lg:w-auto">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Khám phá</h4>
                <div className="flex flex-col gap-2 text-[11px] font-medium text-gray-500">
                  <a href="#" className="hover:text-orange-600 transition-colors">Menu món ngon</a>
                  <a href="#" className="hover:text-orange-600 transition-colors">Khuyến mãi</a>
                  <a href="#" className="hover:text-orange-600 transition-colors">Thương hiệu</a>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Chính sách</h4>
                <div className="flex flex-col gap-2 text-[11px] font-medium text-gray-500">
                  <a href="#" className="hover:text-orange-600 transition-colors">Giao nhận</a>
                  <a href="#" className="hover:text-orange-600 transition-colors">Bảo mật</a>
                  <a href="#" className="hover:text-orange-600 transition-colors">Điều khoản</a>
                </div>
              </div>
              <div className="space-y-4 col-span-2 sm:col-span-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Quản lý</h4>
                <div className="flex flex-col gap-2 text-[11px] font-medium text-gray-500">
                  <button onClick={() => setView('admin')} className="text-left hover:text-orange-600 transition-colors font-bold">Admin Portal</button>
                  <a href="#" className="hover:text-orange-600 transition-colors">Hợp tác</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
            <p>© 2024 {shopSettings.shopName} • Powered by AI Studio</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Vietnam</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>Tiếng Việt</span>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={handleCheckout}
      />

      <Toaster position="top-center" richColors />

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetail 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* Mini Cart FAB on Mobile */}
      {view === 'menu' && (
        <div className="fixed bottom-6 right-6 lg:hidden z-40">
           <button 
            onClick={() => setIsCartOpen(true)}
            className="p-4 bg-orange-600 text-white rounded-full shadow-2xl shadow-orange-500/50 flex items-center justify-center relative active:scale-90 transition-transform"
           >
             < Utensils size={28} />
           </button>
        </div>
      )}
    </div>
  );
}
