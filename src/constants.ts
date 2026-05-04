import { Product, Addon } from "./types";

export const CATEGORIES = ["Phổ biến", "Món chính", "Khai vị", "Đồ uống", "Tráng miệng", "Ăn vặt"];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Cơm Tấm Sườn Bì Chả",
    description: "Cơm tấm truyền thống với sườn nướng mật ong, bì thính và chả chưng đặc biệt.",
    price: 55000,
    category: "Món chính",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800&auto=format&fit=crop",
    rating: 4.8,
    reviewCount: 1250,
    addons: [
      { id: "a1", name: "Trứng ốp la", price: 10000 },
      { id: "a2", name: "Thêm sườn", price: 25000 },
    ]
  },
  {
    id: "2",
    name: "Phở Bò Tái Lăn",
    description: "Phở bò Hà Nội với thịt bò tái lăn gừng tỏi thơm nức, nước dùng trong thanh.",
    price: 65000,
    category: "Món chính",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800&auto=format&fit=crop",
    rating: 4.9,
    reviewCount: 850,
    addons: [
      { id: "a3", name: "Quẩy (3 cái)", price: 10000 },
      { id: "a4", name: "Trứng chần", price: 10000 },
    ]
  },
  {
    id: "3",
    name: "Trà Đào Cam Sả",
    description: "Trà đào thơm mát kết hợp với cam tươi và hương sả nồng nàn.",
    price: 35000,
    category: "Đồ uống",
    image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?q=80&w=800&auto=format&fit=crop",
    rating: 4.7,
    reviewCount: 2100
  }
];
