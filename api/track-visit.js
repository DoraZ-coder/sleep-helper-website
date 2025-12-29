import { getRedis } from './_redis.js';

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        const { page, visitorId } = req.body;

        if (!page || !visitorId) {
            return res.status(400).json({ error: '缺少参数' });
        }

        const redis = getRedis();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const timestamp = new Date().toISOString();

        // 记录访问日志: visit:YYYY-MM-DD -> Set of visitorIds
        await redis.sadd(`visit:${today}`, visitorId);

        // 记录页面访问详情: visit_log:YYYY-MM-DD -> List of {visitorId, page, timestamp}
        await redis.rpush(`visit_log:${today}`, JSON.stringify({
            visitorId,
            page,
            timestamp
        }));

        // 设置过期时间为90天
        await redis.expire(`visit:${today}`, 90 * 24 * 60 * 60);
        await redis.expire(`visit_log:${today}`, 90 * 24 * 60 * 60);

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Track visit error:', error);
        return res.status(500).json({ error: '服务器错误' });
    }
}
