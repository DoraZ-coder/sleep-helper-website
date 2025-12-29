// 支付回调API - 接收支付平台的通知
import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  // 支付平台会发POST请求到这个地址
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 获取支付平台发来的数据
    const callbackData = req.body;

    console.log('收到支付回调:', callbackData);

    // ========== 虎皮椒回调验证 ==========
    const PAYMENT_SECRET = process.env.PAYMENT_SECRET || 'YOUR_SECRET';

    // 验证签名
    const receivedSign = callbackData.hash;
    const calculatedSign = generateSign(callbackData, PAYMENT_SECRET);

    if (receivedSign !== calculatedSign) {
      console.error('签名验证失败');
      return res.status(400).send('fail');
    }

    // 获取订单信息
    const orderId = callbackData.trade_order_id;
    const paymentStatus = callbackData.status; // OD: 已支付
    const actualAmount = parseFloat(callbackData.total_fee);

    // 从数据库获取订单
    const order = await kv.get(`order:${orderId}`);

    if (!order) {
      console.error('订单不存在:', orderId);
      return res.status(404).send('fail');
    }

    // 验证金额
    if (actualAmount !== order.amount) {
      console.error('金额不匹配');
      return res.status(400).send('fail');
    }

    // 如果已经是已支付状态，直接返回成功（防止重复通知）
    if (order.status === 'paid') {
      return res.status(200).send('success');
    }

    // 更新订单状态为已支付
    if (paymentStatus === 'OD') {
      order.status = 'paid';
      order.paidAt = Date.now();

      // 更新订单
      await kv.set(`order:${orderId}`, order);

      // 给用户创建永久访问权限
      await kv.set(`user:${order.userId}:paid`, true); // 永久有效，不设置过期时间

      console.log('订单支付成功:', orderId);

      // 返回success告诉支付平台我们已收到通知
      return res.status(200).send('success');
    }

    return res.status(200).send('success');

  } catch (error) {
    console.error('处理支付回调失败:', error);
    return res.status(500).send('fail');
  }
}

// 生成签名（虎皮椒算法）
function generateSign(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const signString = sortedKeys
    .filter(key => params[key] !== '' && key !== 'hash')
    .map(key => `${key}=${params[key]}`)
    .join('&') + secret;

  return crypto.createHash('md5').update(signString).digest('hex');
}
