import { getRedis } from './_redis.js';
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

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        // 验证密码长度
        if (password.length < 6) {
            return res.status(400).json({ error: '密码至少需要6位字符' });
        }

        const redis = getRedis();

        // 检查用户是否已存在
        const existingUser = await redis.get(`user:${email}`);
        if (existingUser) {
            return res.status(400).json({ error: '该邮箱已被注册' });
        }

        // 密码加密（使用SHA256）
        const passwordHash = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        // 创建用户数据
        const userData = {
            email: email,
            passwordHash: passwordHash,
            isPurchased: false,
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };

        // 保存到数据库
        await redis.set(`user:${email}`, JSON.stringify(userData));

        // 返回成功
        return res.status(201).json({
            success: true,
            message: '注册成功'
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
}
