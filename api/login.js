import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        const { email, password } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }

        // 获取用户数据
        const userDataStr = await kv.get(`user:${email}`);
        if (!userDataStr) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        const userData = JSON.parse(userDataStr);

        // 验证密码
        const passwordHash = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        if (passwordHash !== userData.passwordHash) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // 生成token（简单版本：email + 时间戳的hash）
        const token = crypto
            .createHash('sha256')
            .update(email + Date.now() + process.env.JWT_SECRET || 'sleep-helper-secret')
            .digest('hex');

        // 更新最后登录时间
        userData.lastLoginAt = new Date().toISOString();
        await kv.set(`user:${email}`, JSON.stringify(userData));

        // 保存token
        await kv.set(`token:${token}`, email, { ex: 60 * 60 * 24 * 30 }); // 30天过期

        // 返回成功
        return res.status(200).json({
            success: true,
            token: token,
            email: userData.email,
            isPurchased: userData.isPurchased
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
}
