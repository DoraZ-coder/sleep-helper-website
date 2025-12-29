import { getRedis } from './_redis.js';
import crypto from 'crypto';

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        const { email, password, autoRegister } = req.body;

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
        let isNewUser = false;

        // 获取用户数据
        const userDataStr = await redis.get(`user:${email}`);

        let userData;
        const passwordHash = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        if (!userDataStr) {
            // 用户不存在
            if (autoRegister) {
                // 自动创建新用户
                userData = {
                    email: email,
                    passwordHash: passwordHash,
                    isPurchased: false,
                    createdAt: new Date().toISOString(),
                    lastLoginAt: null
                };
                await redis.set(`user:${email}`, JSON.stringify(userData));
                isNewUser = true;
            } else {
                return res.status(401).json({ error: '邮箱或密码错误' });
            }
        } else {
            // 用户存在，验证密码
            userData = JSON.parse(userDataStr);

            if (passwordHash !== userData.passwordHash) {
                return res.status(401).json({ error: '邮箱或密码错误' });
            }
        }

        // 生成token（简单版本：email + 时间戳的hash）
        const token = crypto
            .createHash('sha256')
            .update(email + Date.now() + (process.env.JWT_SECRET || 'sleep-helper-secret'))
            .digest('hex');

        // 更新最后登录时间
        userData.lastLoginAt = new Date().toISOString();
        await redis.set(`user:${email}`, JSON.stringify(userData));

        // 保存token (ioredis的setex方法)
        await redis.setex(`token:${token}`, 60 * 60 * 24 * 30, email); // 30天过期

        // 返回成功
        return res.status(200).json({
            success: true,
            token: token,
            email: userData.email,
            isPurchased: userData.isPurchased,
            isNewUser: isNewUser
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
}
