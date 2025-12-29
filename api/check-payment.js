// 检查用户是否已付款
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // 允许GET和POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 获取用户ID
    const userId = req.method === 'GET' ? req.query.userId : req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 检查用户是否已付款
    const hasPaid = await kv.get(`user:${userId}:paid`);

    if (hasPaid) {
      return res.status(200).json({
        success: true,
        paid: true,
        message: '已购买'
      });
    }

    // 如果没有付款记录，检查是否有待支付的订单
    const orderId = await kv.get(`user:${userId}:order`);

    if (orderId) {
      const order = await kv.get(`order:${orderId}`);

      if (order) {
        return res.status(200).json({
          success: true,
          paid: order.status === 'paid',
          status: order.status,
          orderId: orderId
        });
      }
    }

    // 没有任何记录
    return res.status(200).json({
      success: true,
      paid: false,
      message: '未购买'
    });

  } catch (error) {
    console.error('检查支付状态失败:', error);
    res.status(500).json({ error: '检查支付状态失败' });
  }
}
