import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseFee = 15000;
    const randomDistance = Math.floor(Math.random() * 8) + 1;
    const distanceFee = randomDistance > 2 ? (randomDistance - 2) * 5000 : 0;
    const totalFee = baseFee + distanceFee;

    res.json({
      estimate: totalFee,
      currency: 'VND',
      provider: 'Grab Express',
      distance: `${randomDistance}km`,
      time: `${15 + randomDistance * 3} mins`,
    });
  } catch (error) {
    console.error('Shipping estimate error:', error);
    res.status(500).json({ error: 'Không thể tính phí vận chuyển' });
  }
}
