import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        format: 'json',
        q: String(q),
        countrycodes: 'vn',
        limit: 5,
      },
      headers: {
        'User-Agent': 'FoodieGo-VN-App/1.0',
      },
      timeout: 5000,
    });

    res.json(response.data);
  } catch (error: any) {
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Too many requests', fallback: true });
    }
    console.error('Geocoding proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
}
