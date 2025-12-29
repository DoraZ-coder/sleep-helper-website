import { getRedis } from './_redis.js';

// 生成随机字符串
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        const { prefix = 'SLEEP', count = 1, adminKey } = req.body;

        // 简单的管理员验证（你可以在Vercel环境变量中设置ADMIN_KEY）
        const correctAdminKey = process.env.ADMIN_KEY || 'admin123';
        if (adminKey !== correctAdminKey) {
            return res.status(401).json({ error: '管理员密钥错误' });
        }

        // 验证数量
        if (count < 1 || count > 100) {
            return res.status(400).json({ error: '数量必须在1-100之间' });
        }

        const redis = getRedis();
        const passwords = [];

        for (let i = 0; i < count; i++) {
            const randomPart = generateRandomString(6);
            const passwordCode = prefix ? `${prefix}-${randomPart}` : randomPart;

            // 创建密码数据
            const passwordData = {
                code: passwordCode,
                used: false,
                usedBy: null,
                usedAt: null,
                createdAt: new Date().toISOString()
            };

            // 保存到数据库
            await redis.set(`password:${passwordCode}`, JSON.stringify(passwordData));

            passwords.push(passwordCode);
        }

        return res.status(201).json({
            success: true,
            passwords: passwords,
            count: passwords.length
        });

    } catch (error) {
        console.error('Generate passwords error:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
}
