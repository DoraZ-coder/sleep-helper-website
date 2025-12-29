import { getRedis } from './_redis.js';

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        const { email } = req.body;

        // 验证输入
        if (!email) {
            return res.status(400).json({ error: '邮箱不能为空' });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        const redis = getRedis();

        // 检查用户是否存在
        const userDataStr = await redis.get(`user:${email}`);
        const exists = !!userDataStr;

        return res.status(200).json({
            success: true,
            exists: exists,
            isNewUser: !exists
        });

    } catch (error) {
        console.error('Check email error:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
}
