import { getRedis } from './_redis.js';

export default async function handler(req, res) {
    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        // 验证token
        if (!token) {
            return res.status(401).json({ error: '请先登录' });
        }

        const redis = getRedis();

        // 获取用户邮箱
        const userEmail = await redis.get(`token:${token}`);
        if (!userEmail) {
            return res.status(401).json({ error: '登录已过期，请重新登录' });
        }

        // 获取用户数据
        const userDataStr = await redis.get(`user:${userEmail}`);
        if (!userDataStr) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const userData = JSON.parse(userDataStr);

        // 返回购买状态
        return res.status(200).json({
            success: true,
            email: userData.email,
            isPurchased: userData.isPurchased,
            purchasedAt: userData.purchasedAt || null
        });

    } catch (error) {
        console.error('Check purchase error:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
}
