import { ShoppingBag, Search, User, MapPin, LogIn, LogOut, History, ChevronDown, X, Settings } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { auth, db } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onHistoryClick: () => void;
  onAdminClick: () => void;
  shopIcon?: string;
  shopName?: string;
}

export default function Navbar({ 
  onCartClick, 
  searchQuery, 
  onSearchChange, 
  onHistoryClick,
  onAdminClick,
  shopIcon,
  shopName = 'FoodieGo'
}: NavbarProps) {
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef).then(docSnap => {
          if (!docSnap.exists()) {
            setDoc(userRef, {
              email: user.email,
              name: user.displayName,
              userId: user.uid,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          } else {
            setDoc(userRef, {
              email: user.email,
              name: user.displayName,
              userId: user.uid,
              updatedAt: Date.now()
            }, { merge: true });
          }
        }).catch(err => console.error("Error syncing user profile:", err));

        const isSuperAdmin = user.email === 'xuanduan1905@gmail.com';
        let isRegularAdmin = false;
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          isRegularAdmin = adminDoc.exists();
        } catch (e) {
          // Ignore
        }
        setIsAdmin(isSuperAdmin || isRegularAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          name: result.user.displayName,
          userId: result.user.uid,
          updatedAt: Date.now()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer group">
            {shopIcon && (
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shadow-sm shrink-0">
                <img src={shopIcon || undefined} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="text-xl lg:text-2xl font-black text-orange-600 tracking-tighter uppercase group-hover:text-orange-700 transition-colors">
              {shopName}
            </h1>
          </div>
          <div className="hidden xl:flex items-center gap-2 text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <MapPin size={14} className="text-orange-500" />
            <span className="truncate max-w-[150px] font-medium text-[10px] uppercase tracking-wider">Hồ Chí Minh</span>
          </div>
        </div>

        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm món ăn..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-sm transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 relative" ref={menuRef}>
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search size={20} />
          </button>

          <button 
            onClick={onCartClick}
            className="flex items-center justify-center bg-orange-600 text-white w-10 h-10 lg:w-11 lg:h-11 rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 relative group shrink-0"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 lg:gap-3 p-1 pl-3 pr-2 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-gray-900 leading-none">{user.displayName}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Thành viên</p>
                </div>
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full overflow-hidden border border-white shadow-sm shrink-0">
                  <img src={user.photoURL || undefined} alt="" className="w-full h-full object-cover" />
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5"
                  >
                    <div className="px-4 py-2 border-b border-gray-50 mb-1 lg:hidden">
                      <p className="text-[10px] font-black text-gray-900 truncate">{user.displayName}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">Thành viên</p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        onHistoryClick();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors uppercase tracking-wider"
                    >
                      <History size={16} />
                      <span>Đơn hàng của tôi</span>
                    </button>
                    
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          onAdminClick();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors uppercase tracking-wider"
                      >
                        <Settings size={16} />
                        <span>Admin Portal</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors uppercase tracking-wider"
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-3 py-1.5 text-[10px] lg:text-xs font-black text-gray-600 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-widest border border-gray-100"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 md:hidden shadow-sm"
          >
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm món ăn..." 
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-sm transition-all placeholder:text-gray-400"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 text-gray-500 bg-gray-50 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
