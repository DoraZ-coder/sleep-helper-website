import { getRedis } from './_redis.js';

export default async function handler(req, res) {
    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        // 验证管理员权限
        const adminKey = req.headers['x-admin-key'];
        const correctAdminKey = process.env.ADMIN_KEY || 'admin123';

        if (adminKey !== correctAdminKey) {
            return res.status(401).json({ error: '管理员密钥错误' });
        }

        const redis = getRedis();

        // 获取所有用户
        const userKeys = await redis.keys('user:*');
        const users = [];

        for (const key of userKeys) {
            const userDataStr = await redis.get(key);
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    // 不返回密码哈希
                    const { passwordHash, ...userInfo } = userData;
                    users.push(userInfo);
                } catch (e) {
                    console.error('Parse user error:', e);
                }
            }
        }

        // 按注册时间倒序排列（最新的在前）
        users.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });

        return res.status(200).json({
            success: true,
            total: users.length,
            users: users
        });

    } catch (error) {
        console.error('List users error:', error);
        return res.status(500).json({ error: '服务器错误', details: error.message });
    }
}
