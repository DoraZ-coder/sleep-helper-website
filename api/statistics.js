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

        // ============ 2. 访客数据（新增） ============
        // 今日新增访客数（首次访问）
        const todayNewVisitors = await redis.scard(`new_visitor:${today}`) || 0;

        // 昨日新增访客数
        const yesterdayNewVisitors = await redis.scard(`new_visitor:${yesterday}`) || 0;

        // ============ 3. 注册用户数据 ============
        // 获取所有注册用户
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

        // 总注册用户数
        const totalUsers = users.length;

        // 今日注册用户数
        const todayRegisteredUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === today;
        }).length;

        // 昨日注册用户数
        const yesterdayRegisteredUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === yesterday;
        }).length;

        // 7天前注册用户数
        const sevenDaysAgoRegisteredUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === sevenDaysAgo;
        }).length;

        // ============ 4. 注册转化率 ============
        // 注册转化率 = 今日注册用户数 / 今日UV × 100%
        const registrationRate = todayUV > 0 ? ((todayRegisteredUsers / todayUV) * 100).toFixed(2) : 0;

        // ============ 5. 留存率 ============
        // 次日留存率：昨日注册的用户中，今天登录过的比例
        const yesterdayRegisteredUsersList = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === yesterday;
        });

        const yesterdayRetainedUsers = yesterdayRegisteredUsersList.filter(user => {
            if (!user.lastLoginAt) return false;
            const lastLoginDate = user.lastLoginAt.split('T')[0];
            return lastLoginDate === today;
        }).length;

        const nextDayRetention = yesterdayRegisteredUsersList.length > 0
            ? ((yesterdayRetainedUsers / yesterdayRegisteredUsersList.length) * 100).toFixed(2)
            : 0;

        // 7日留存率：7天前注册的用户中，今天登录过的比例
        const sevenDaysAgoRegisteredUsersList = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = user.createdAt.split('T')[0];
            return createdDate === sevenDaysAgo;
        });

        const sevenDaysRetainedUsers = sevenDaysAgoRegisteredUsersList.filter(user => {
            if (!user.lastLoginAt) return false;
            const lastLoginDate = user.lastLoginAt.split('T')[0];
            return lastLoginDate === today;
        }).length;

        const sevenDayRetention = sevenDaysAgoRegisteredUsersList.length > 0
            ? ((sevenDaysRetainedUsers / sevenDaysAgoRegisteredUsersList.length) * 100).toFixed(2)
            : 0;

        // ============ 6. 付费数据 ============
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

        // ============ 7. 近7日趋势数据 ============
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // 该日UV
            const uv = await redis.scard(`visit:${date}`) || 0;

            // 该日新增访客数（首次访问）
            const newVisitors = await redis.scard(`new_visitor:${date}`) || 0;

            // 该日注册用户数
            const newRegistrations = users.filter(user => {
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
                newVisitors,
                newRegistrations,
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
                    yesterdayUV,
                    todayNewVisitors,
                    yesterdayNewVisitors
                },
                // 注册用户数据
                user: {
                    total: totalUsers,
                    todayRegistered: todayRegisteredUsers,
                    yesterdayRegistered: yesterdayRegisteredUsers,
                    sevenDaysAgoRegistered: sevenDaysAgoRegisteredUsers
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
                        base: yesterdayRegisteredUsersList.length,
                        retained: yesterdayRetainedUsers
                    },
                    sevenDayDetail: {
                        base: sevenDaysAgoRegisteredUsersList.length,
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
