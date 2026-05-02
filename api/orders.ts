import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orderData = req.body;
  console.log('Đơn hàng mới nhận:', orderData.id);
  res.json({ success: true, message: 'Đơn hàng đã được tiếp nhận' });
}
