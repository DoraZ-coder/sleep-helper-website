import { getRedis } from './_redis.js';

export default async function handler(req, res) {
    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        const adminKey = req.headers['x-admin-key'];

        // 简单的管理员验证
        const correctAdminKey = process.env.ADMIN_KEY || 'admin123';

        // 调试信息（生产环境应删除）
        console.log('Received admin key:', adminKey ? '***' : 'null');
        console.log('Expected admin key:', correctAdminKey ? '***' : 'null');
        console.log('ADMIN_KEY env exists:', !!process.env.ADMIN_KEY);

        if (adminKey !== correctAdminKey) {
            return res.status(401).json({
                error: '管理员密钥错误',
                debug: {
                    receivedLength: adminKey ? adminKey.length : 0,
                    expectedLength: correctAdminKey ? correctAdminKey.length : 0,
                    usingEnvVar: !!process.env.ADMIN_KEY
                }
            });
        }

        const redis = getRedis();

        // 获取所有密码键
        const keys = await redis.keys('password:*');

        const passwords = [];

        // 获取每个密码的详细信息
        for (const key of keys) {
            const passwordDataStr = await redis.get(key);
            if (passwordDataStr) {
                const passwordData = JSON.parse(passwordDataStr);
                passwords.push(passwordData);
            }
        }

        // 按创建时间排序（最新的在前）
        passwords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({
            success: true,
            passwords: passwords,
            total: passwords.length,
            unused: passwords.filter(p => !p.used).length,
            used: passwords.filter(p => p.used).length
        });

    } catch (error) {
        console.error('List passwords error:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
}
