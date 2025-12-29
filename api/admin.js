import { getRedis } from './_redis.js';

export default async function handler(req, res) {
    try {
        // 验证管理员权限
        const adminKey = req.headers['x-admin-key'];
        const correctAdminKey = process.env.ADMIN_KEY || 'admin123';

        if (adminKey !== correctAdminKey) {
            return res.status(401).json({ error: '管理员密钥错误' });
        }

        const redis = getRedis();
        const { action } = req.query;

        // ============ 1. 统计数据 ============
        if (action === 'statistics') {
            if (req.method !== 'GET') {
                return res.status(405).json({ error: '方法不允许' });
            }

            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // 访问数据
            const todayUV = await redis.scard(`visit:${today}`) || 0;
            const todayPVCount = await redis.llen(`visit_log:${today}`) || 0;
            const yesterdayUV = await redis.scard(`visit:${yesterday}`) || 0;
            const todayNewVisitors = await redis.scard(`new_visitor:${today}`) || 0;
            const yesterdayNewVisitors = await redis.scard(`new_visitor:${yesterday}`) || 0;

            // 用户数据
            const userKeys = await redis.keys('user:*');
            const users = [];
            for (const key of userKeys) {
                const userDataStr = await redis.get(key);
                if (userDataStr) {
                    try {
                        users.push(JSON.parse(userDataStr));
                    } catch (e) {
                        console.error('Parse user error:', e);
                    }
                }
            }

            const totalUsers = users.length;
            const todayRegisteredUsers = users.filter(user => {
                if (!user.createdAt) return false;
                return user.createdAt.split('T')[0] === today;
            }).length;

            const yesterdayRegisteredUsers = users.filter(user => {
                if (!user.createdAt) return false;
                return user.createdAt.split('T')[0] === yesterday;
            }).length;

            const sevenDaysAgoRegisteredUsers = users.filter(user => {
                if (!user.createdAt) return false;
                return user.createdAt.split('T')[0] === sevenDaysAgo;
            }).length;

            // 注册转化率
            const registrationRate = todayUV > 0 ? ((todayRegisteredUsers / todayUV) * 100).toFixed(2) : 0;

            // 留存率
            const yesterdayRegisteredUsersList = users.filter(user => {
                if (!user.createdAt) return false;
                return user.createdAt.split('T')[0] === yesterday;
            });

            const yesterdayRetainedUsers = yesterdayRegisteredUsersList.filter(user => {
                if (!user.lastLoginAt) return false;
                return user.lastLoginAt.split('T')[0] === today;
            }).length;

            const nextDayRetention = yesterdayRegisteredUsersList.length > 0
                ? ((yesterdayRetainedUsers / yesterdayRegisteredUsersList.length) * 100).toFixed(2)
                : 0;

            const sevenDaysAgoRegisteredUsersList = users.filter(user => {
                if (!user.createdAt) return false;
                return user.createdAt.split('T')[0] === sevenDaysAgo;
            });

            const sevenDaysRetainedUsers = sevenDaysAgoRegisteredUsersList.filter(user => {
                if (!user.lastLoginAt) return false;
                return user.lastLoginAt.split('T')[0] === today;
            }).length;

            const sevenDayRetention = sevenDaysAgoRegisteredUsersList.length > 0
                ? ((sevenDaysRetainedUsers / sevenDaysAgoRegisteredUsersList.length) * 100).toFixed(2)
                : 0;

            // 付费数据
            const paidUsers = users.filter(user => user.isPurchased === true).length;
            const paymentRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(2) : 0;
            const todayPaidUsers = users.filter(user => {
                if (!user.isPurchased || !user.purchasedAt) return false;
                return user.purchasedAt.split('T')[0] === today;
            }).length;

            // 7日趋势
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const uv = await redis.scard(`visit:${date}`) || 0;
                const newVisitors = await redis.scard(`new_visitor:${date}`) || 0;
                const newRegistrations = users.filter(user => {
                    if (!user.createdAt) return false;
                    return user.createdAt.split('T')[0] === date;
                }).length;
                const newPaidUsers = users.filter(user => {
                    if (!user.isPurchased || !user.purchasedAt) return false;
                    return user.purchasedAt.split('T')[0] === date;
                }).length;

                last7Days.push({ date, uv, newVisitors, newRegistrations, newPaidUsers });
            }

            return res.status(200).json({
                success: true,
                data: {
                    visit: { todayUV, todayPV: todayPVCount, yesterdayUV, todayNewVisitors, yesterdayNewVisitors },
                    user: { total: totalUsers, todayRegistered: todayRegisteredUsers, yesterdayRegistered: yesterdayRegisteredUsers, sevenDaysAgoRegistered: sevenDaysAgoRegisteredUsers },
                    conversion: { registrationRate: registrationRate + '%', paymentRate: paymentRate + '%' },
                    retention: {
                        nextDay: nextDayRetention + '%',
                        sevenDay: sevenDayRetention + '%',
                        nextDayDetail: { base: yesterdayRegisteredUsersList.length, retained: yesterdayRetainedUsers },
                        sevenDayDetail: { base: sevenDaysAgoRegisteredUsersList.length, retained: sevenDaysRetainedUsers }
                    },
                    payment: { total: paidUsers, todayNew: todayPaidUsers },
                    trends: last7Days,
                    updatedAt: new Date().toISOString()
                }
            });
        }

        // ============ 2. 用户列表 ============
        if (action === 'list-users') {
            if (req.method !== 'GET') {
                return res.status(405).json({ error: '方法不允许' });
            }

            const userKeys = await redis.keys('user:*');
            const users = [];

            for (const key of userKeys) {
                const userDataStr = await redis.get(key);
                if (userDataStr) {
                    try {
                        const userData = JSON.parse(userDataStr);
                        const { passwordHash, ...userInfo } = userData;
                        users.push(userInfo);
                    } catch (e) {
                        console.error('Parse user error:', e);
                    }
                }
            }

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
        }

        // ============ 3. 密码列表 ============
        if (action === 'list-passwords') {
            if (req.method !== 'GET') {
                return res.status(405).json({ error: '方法不允许' });
            }

            const passwordKeys = await redis.keys('password:*');
            const passwords = [];

            for (const key of passwordKeys) {
                const passwordDataStr = await redis.get(key);
                if (passwordDataStr) {
                    try {
                        const passwordData = JSON.parse(passwordDataStr);
                        passwords.push(passwordData);
                    } catch (e) {
                        console.error('Parse password error:', e);
                    }
                }
            }

            passwords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const total = passwords.length;
            const unused = passwords.filter(p => !p.used).length;
            const used = passwords.filter(p => p.used).length;

            return res.status(200).json({
                success: true,
                total,
                unused,
                used,
                passwords
            });
        }

        // ============ 4. 生成密码 ============
        if (action === 'generate-passwords') {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: '方法不允许' });
            }

            const { prefix = 'SLEEP', count = 1 } = req.body;

            if (count < 1 || count > 100) {
                return res.status(400).json({ error: '生成数量必须在1-100之间' });
            }

            const generated = [];
            for (let i = 0; i < count; i++) {
                const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
                const passwordCode = `${prefix}${randomPart}`;

                const passwordData = {
                    code: passwordCode,
                    used: false,
                    usedBy: null,
                    usedAt: null,
                    createdAt: new Date().toISOString()
                };

                await redis.set(`password:${passwordCode}`, JSON.stringify(passwordData));
                generated.push(passwordCode);
            }

            return res.status(200).json({
                success: true,
                count: generated.length,
                passwords: generated
            });
        }

        return res.status(400).json({ error: '未知操作' });

    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(500).json({ error: '服务器错误', details: error.message });
    }
}
