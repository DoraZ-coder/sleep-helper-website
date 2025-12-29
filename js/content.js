// 内容页面标签切换逻辑

document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.content-tab');
    const categories = document.querySelectorAll('.content-category');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-category');

            // 移除所有激活状态
            tabs.forEach(t => t.classList.remove('active'));
            categories.forEach(c => c.classList.remove('active'));

            // 添加当前激活状态
            this.classList.add('active');
            document.getElementById(categoryId).classList.add('active');

            // 滚动到内容区域
            document.getElementById(categoryId).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
});
