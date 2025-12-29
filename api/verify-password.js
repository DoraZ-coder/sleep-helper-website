import { getRedis } from './_redis.js';

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        const { password, token } = req.body;

        // 验证输入
        if (!password || !token) {
            return res.status(400).json({ error: '密码和登录凭证不能为空' });
        }

        const redis = getRedis();

        // 验证用户登录状态
        const userEmail = await redis.get(`token:${token}`);
        if (!userEmail) {
            return res.status(401).json({ error: '请先登录' });
        }

        // 获取用户数据
        const userDataStr = await redis.get(`user:${userEmail}`);
        if (!userDataStr) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const userData = JSON.parse(userDataStr);

        // 检查用户是否已经购买过
        if (userData.isPurchased) {
            return res.status(200).json({
                success: true,
                message: '您已经购买过报告，可以直接查看',
                alreadyPurchased: true
            });
        }

        // 验证密码是否存在
        const passwordCode = password.trim().toUpperCase();
        const passwordDataStr = await redis.get(`password:${passwordCode}`);

        if (!passwordDataStr) {
            return res.status(400).json({ error: '密码不存在或已失效' });
        }

        const passwordData = JSON.parse(passwordDataStr);

        // 检查密码是否已被使用
        if (passwordData.used) {
            return res.status(400).json({
                error: '该密码已被使用',
                usedBy: passwordData.usedBy !== userEmail ? '其他用户' : '您',
                usedAt: passwordData.usedAt
            });
        }

        // 标记密码为已使用
        passwordData.used = true;
        passwordData.usedBy = userEmail;
        passwordData.usedAt = new Date().toISOString();
        await redis.set(`password:${passwordCode}`, JSON.stringify(passwordData));

        // 更新用户购买状态
        userData.isPurchased = true;
        userData.purchasedAt = new Date().toISOString();
        userData.usedPassword = passwordCode;
        await redis.set(`user:${userEmail}`, JSON.stringify(userData));

        // 返回成功
        return res.status(200).json({
            success: true,
            message: '解锁成功！欢迎查看完整报告',
            isPurchased: true
        });

    } catch (error) {
        console.error('Verify password error:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
}
