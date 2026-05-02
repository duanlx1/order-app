import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple in-memory cache for geocoding
  const geoCache = new Map();

  // Proxy Geocoding API (using OSM Nominatim)
  app.get("/api/geocoding/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    if (geoCache.has(q)) {
      return res.json(geoCache.get(q));
    }

    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          format: 'json',
          q: q,
          countrycodes: 'vn',
          limit: 5
        },
        headers: {
          'User-Agent': 'FoodieGo-VN-App/1.0 (xuanduan1905@gmail.com)'
        },
        timeout: 5000
      });

      geoCache.set(q, response.data);
      // Clear cache if too large
      if (geoCache.size > 100) geoCache.clear();

      res.json(response.data);
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn("Geocoding rate limited. Using fallback.");
        return res.status(429).json({ error: "Too many requests", fallback: true });
      }
      console.error("Geocoding proxy error:", error.message);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example Voucher Check API
  app.post("/api/vouchers/validate", (req, res) => {
    const { code, cartTotal } = req.body;
    // Mock voucher logic
    if (code === "FOODIEGO" && cartTotal >= 100000) {
      return res.json({ valid: true, discount: 20000, message: "Voucher applied!" });
    }
    res.json({ valid: false, message: "Invalid voucher or condition not met." });
  });

  // Grab Shipping Estimate API
  // Documentation: https://developer.grab.com/docs/express
  app.post("/api/shipping/estimate", async (req, res) => {
    const { origin, destination } = req.body;
    
    /**
     * LOGIC DỰ KIẾN KHI TÍCH HỢP GRAB API:
     * 1. Lấy tọa độ (lat/long) từ địa chỉ destination (sử dụng Google Geocoding API).
     * 2. Gọi API Grab Express: POST https://partner-api.grab.com/grab-express/v1/deliveries/quotes
     *    - Headers: Authorization (Bearer token từ OAuth)
     *    - Body: { origin: { lat, lng }, destination: { lat, lng }, serviceType: 'INSTANT' }
     * 3. Trả về kết quả cho Client.
     */

    try {
      // Giả lập logic tính toán dựa trên khoảng cách (thay cho API thực tế)
      const baseFee = 15000; // Phí cơ bản cho 2km đầu tiên
      const randomDistance = Math.floor(Math.random() * 8) + 1; // Giả lập khoảng cách 1-8km
      const distanceFee = randomDistance > 2 ? (randomDistance - 2) * 5000 : 0;
      const totalFee = baseFee + distanceFee;
      
      res.json({ 
        estimate: totalFee, 
        currency: "VND", 
        provider: "Grab Express",
        distance: `${randomDistance}km`,
        time: `${15 + randomDistance * 3} mins` 
      });
    } catch (error) {
      console.error("Grab API Error:", error);
      res.status(500).json({ error: "Không thể tính phí vận chuyển" });
    }
  });

  // API tạo đơn hàng và lưu vào Database
  app.post("/api/orders", (req, res) => {
    const orderData = req.body;
    
    // Logic:
    // 1. Kiểm tra Voucher lại một lần nữa ở Server-side
    // 2. Lưu vào Firestore (khi đã setup xong)
    // 3. Nếu order status là 'Ready', gọi API Grab để book shipper:
    //    POST https://partner-api.grab.com/grab-express/v1/deliveries
    
    console.log("Đơn hàng mới nhận:", orderData.id);
    res.json({ success: true, message: "Đơn hàng đã được tiếp nhận" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
