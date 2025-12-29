// 创建支付订单API
import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    const { sleepType } = req.body;

    // 生成唯一订单号
    const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 生成用户标识（基于浏览器指纹或随机生成）
    const userId = req.body.userId || crypto.randomBytes(16).toString('hex');

    // 订单信息
    const orderData = {
      orderId,
      userId,
      sleepType,
      amount: 9.9,
      status: 'pending', // pending: 待支付, paid: 已支付
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000 // 30分钟过期
    };

    // 存储到Vercel KV（Redis）
    await kv.set(`order:${orderId}`, orderData, { ex: 1800 }); // 30分钟过期
    await kv.set(`user:${userId}:order`, orderId, { ex: 1800 });

    // 这里需要调用支付平台API生成支付链接
    // 以虎皮椒为例（需要替换成你的appid和secret）
    const paymentUrl = await createPaymentUrl(orderId, orderData.amount);

    res.status(200).json({
      success: true,
      orderId,
      userId,
      paymentUrl,
      qrcode: paymentUrl // 前端可以用这个生成二维码
    });

  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
}

// 调用支付平台API生成支付链接
async function createPaymentUrl(orderId, amount) {
  // ========== 虎皮椒支付示例 ==========
  // 1. 先去 https://www.xunhupay.com 注册账号
  // 2. 获取appid和appsecret
  // 3. 替换下面的配置

  const PAYMENT_CONFIG = {
    appid: process.env.PAYMENT_APPID || 'YOUR_APPID', // 在Vercel环境变量中配置
    appsecret: process.env.PAYMENT_SECRET || 'YOUR_SECRET',
    notifyUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/payment-callback` : 'http://localhost:3000/api/payment-callback'
  };

  // 构造支付参数
  const params = {
    version: '1.1',
    appid: PAYMENT_CONFIG.appid,
    trade_order_id: orderId,
    total_fee: amount,
    title: '睡眠分析完整报告',
    time: Math.floor(Date.now() / 1000),
    notify_url: PAYMENT_CONFIG.notifyUrl,
    return_url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/report.html` : 'http://localhost:3000/report.html',
    nonce_str: Math.random().toString(36).substr(2, 15)
  };

  // 生成签名
  const sign = generateSign(params, PAYMENT_CONFIG.appsecret);
  params.hash = sign;

  // 构造支付URL
  const paymentUrl = 'https://api.xunhupay.com/payment/do.html?' +
    Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');

  return paymentUrl;

  // ========== 如果使用其他支付平台，替换上面的代码 ==========
  // 例如：PayJS、易支付等，参考它们的API文档
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
