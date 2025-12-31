// 睡眠知识页面 - 文章展开/收起逻辑

document.addEventListener('DOMContentLoaded', function() {
    const articlePreviews = document.querySelectorAll('.article-preview');
    const articleFulls = document.querySelectorAll('.article-full');
    const backBtns = document.querySelectorAll('.back-btn');
    const articlesGrid = document.querySelector('.articles-grid');

    // 点击文章预览卡片，展开完整文章
    articlePreviews.forEach(preview => {
        preview.addEventListener('click', function(e) {
            // 如果点击的是按钮，不触发卡片点击
            if (e.target.classList.contains('read-more-btn')) {
                return;
            }

            const articleId = this.getAttribute('data-article');
            showArticle(articleId);
        });
    });

    // 点击"展开阅读"按钮
    document.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            const articleId = this.closest('.article-preview').getAttribute('data-article');
            showArticle(articleId);
        });
    });

    // 点击"返回列表"按钮
    backBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            hideAllArticles();
            showGrid();
        });
    });

    // 显示指定文章
    function showArticle(articleId) {
        // 隐藏文章列表网格
        articlesGrid.style.display = 'none';

        // 隐藏所有完整文章
        articleFulls.forEach(article => {
            article.classList.remove('active');
        });

        // 显示指定的文章
        const targetArticle = document.getElementById(`article-${articleId}`);
        if (targetArticle) {
            targetArticle.classList.add('active');

            // 滚动到页面顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    // 隐藏所有文章
    function hideAllArticles() {
        articleFulls.forEach(article => {
            article.classList.remove('active');
        });
    }

    // 显示文章列表网格
    function showGrid() {
        articlesGrid.style.display = 'grid';

        // 滚动到页面顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // 支持浏览器后退按钮
    window.addEventListener('popstate', function() {
        hideAllArticles();
        showGrid();
    });
});
