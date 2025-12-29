// 访问统计脚本
(function() {
    // 获取或生成访客ID
    function getVisitorId() {
        let visitorId = localStorage.getItem('visitorId');
        if (!visitorId) {
            // 生成唯一ID（时间戳 + 随机数）
            visitorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            localStorage.setItem('visitorId', visitorId);
        }
        return visitorId;
    }

    // 记录访问
    async function trackVisit() {
        const visitorId = getVisitorId();
        const page = window.location.pathname;

        try {
            await fetch('/api/track-visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page, visitorId })
            });
        } catch (error) {
            console.error('Track visit error:', error);
        }
    }

    // 页面加载时记录访问
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackVisit);
    } else {
        trackVisit();
    }
})();
