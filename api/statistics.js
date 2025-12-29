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
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // ============ 1. 访问数据 ============
        // 今日UV
        const todayUV = await redis.scard(`visit:${today}`) || 0;

        // 今日PV（访问日志条数）
        const todayPVCount = await redis.llen(`visit_log:${today}`) || 0;

        // 昨日UV
        const yesterdayUV = await redis.scard(`visit:${yesterday}`) || 0;

        // ============ 2. 用户数据 ============
        // 获取所有用户
        const userKeys = await redis.keys('user:*');
        const users = [];

        for (const key of userKeys) {
            const userDataStr = await redis.get(key);
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    users.push(userData);
                } catch (e) {
                    console.error('Parse user error:', e);
                }
            }
        }

        // 总用户数
        const totalUsers = users.length;

        // 今日新增用户数
        const todayNewUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === today;
        }).length;

        // 昨日新增用户数
        const yesterdayNewUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === yesterday;
        }).length;

        // 7天前新增用户数
        const sevenDaysAgoNewUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === sevenDaysAgo;
        }).length;

        // ============ 3. 注册转化率 ============
        // 注册转化率 = 今日新增用户数 / 今日UV
        const registrationRate = todayUV > 0 ? ((todayNewUsers / todayUV) * 100).toFixed(2) : 0;

        // ============ 4. 留存率 ============
        // 次日留存率：昨日注册的用户中，今天登录过的比例
        const yesterdayRegisteredUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === yesterday;
        });

        const yesterdayRetainedUsers = yesterdayRegisteredUsers.filter(user => {
            if (!user.lastLoginAt) return false;
            const lastLoginDate = user.lastLoginAt.split('T')[0];
            return lastLoginDate === today;
        }).length;

        const nextDayRetention = yesterdayRegisteredUsers.length > 0
            ? ((yesterdayRetainedUsers / yesterdayRegisteredUsers.length) * 100).toFixed(2)
            : 0;

        // 7日留存率：7天前注册的用户中，今天登录过的比例
        const sevenDaysAgoRegisteredUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === sevenDaysAgo;
        });

        const sevenDaysRetainedUsers = sevenDaysAgoRegisteredUsers.filter(user => {
            if (!user.lastLoginAt) return false;
            const lastLoginDate = user.lastLoginAt.split('T')[0];
            return lastLoginDate === today;
        }).length;

        const sevenDayRetention = sevenDaysAgoRegisteredUsers.length > 0
            ? ((sevenDaysRetainedUsers / sevenDaysAgoRegisteredUsers.length) * 100).toFixed(2)
            : 0;

        // ============ 5. 付费数据 ============
        // 已付费用户数
        const paidUsers = users.filter(user => user.isPurchased === true).length;

        // 付费转化率 = 已付费用户数 / 总用户数
        const paymentRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(2) : 0;

        // 今日新增付费用户
        const todayPaidUsers = users.filter(user => {
            if (!user.isPurchased || !user.purchasedAt) return false;
            const purchasedDate = user.purchasedAt.split('T')[0];
            return purchasedDate === today;
        }).length;

        // ============ 6. 近7日趋势数据 ============
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // 该日UV
            const uv = await redis.scard(`visit:${date}`) || 0;

            // 该日新增用户
            const newUsers = users.filter(user => {
                if (!user.createdAt) return false;
                const createdDate = user.createdAt.split('T')[0];
                return createdDate === date;
            }).length;

            // 该日新增付费用户
            const newPaidUsers = users.filter(user => {
                if (!user.isPurchased || !user.purchasedAt) return false;
                const purchasedDate = user.purchasedAt.split('T')[0];
                return purchasedDate === date;
            }).length;

            last7Days.push({
                date,
                uv,
                newUsers,
                newPaidUsers
            });
        }

        // ============ 返回所有统计数据 ============
        return res.status(200).json({
            success: true,
            data: {
                // 访问数据
                visit: {
                    todayUV,
                    todayPV: todayPVCount,
                    yesterdayUV
                },
                // 用户数据
                user: {
                    total: totalUsers,
                    todayNew: todayNewUsers,
                    yesterdayNew: yesterdayNewUsers,
                    sevenDaysAgoNew: sevenDaysAgoNewUsers
                },
                // 转化率
                conversion: {
                    registrationRate: registrationRate + '%',
                    paymentRate: paymentRate + '%'
                },
                // 留存率
                retention: {
                    nextDay: nextDayRetention + '%',
                    sevenDay: sevenDayRetention + '%',
                    nextDayDetail: {
                        base: yesterdayRegisteredUsers.length,
                        retained: yesterdayRetainedUsers
                    },
                    sevenDayDetail: {
                        base: sevenDaysAgoRegisteredUsers.length,
                        retained: sevenDaysRetainedUsers
                    }
                },
                // 付费数据
                payment: {
                    total: paidUsers,
                    todayNew: todayPaidUsers
                },
                // 7日趋势
                trends: last7Days,
                // 更新时间
                updatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Statistics error:', error);
        return res.status(500).json({ error: '服务器错误', details: error.message });
    }
}
