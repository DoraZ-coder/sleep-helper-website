// 睡眠日记功能

document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const diaryForm = document.getElementById('diaryForm');
    const diaryDate = document.getElementById('diaryDate');
    const bedTime = document.getElementById('bedTime');
    const wakeTime = document.getElementById('wakeTime');
    const fallAsleepTime = document.getElementById('fallAsleepTime');
    const wakeCount = document.getElementById('wakeCount');
    const qualityInput = document.getElementById('quality');
    const moodInput = document.getElementById('mood');
    const notesInput = document.getElementById('notes');
    const clearFormBtn = document.getElementById('clearForm');

    const ratingBtns = document.querySelectorAll('.rating-btn');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // 图表实例
    let sleepDurationChart = null;
    let sleepQualityChart = null;
    let fallAsleepChart = null;

    // 初始化
    init();

    function init() {
        // 设置默认日期为今天
        const today = new Date().toISOString().split('T')[0];
        diaryDate.value = today;

        // 绑定评分按钮事件
        ratingBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                ratingBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                qualityInput.value = this.getAttribute('data-value');
            });
        });

        // 绑定心情按钮事件
        moodBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                moodBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                moodInput.value = this.getAttribute('data-value');
            });
        });

        // 绑定表单提交事件
        diaryForm.addEventListener('submit', handleFormSubmit);

        // 绑定清空按钮
        clearFormBtn.addEventListener('click', clearForm);

        // 绑定筛选按钮
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.getAttribute('data-filter');
                renderHistory(filter);
            });
        });

        // 加载数据并渲染
        loadData();
    }

    // 处理表单提交
    function handleFormSubmit(e) {
        e.preventDefault();

        // 验证必填项
        if (!qualityInput.value) {
            alert('请选择睡眠质量评分');
            return;
        }
        if (!moodInput.value) {
            alert('请选择早晨感觉');
            return;
        }

        // 计算睡眠时长
        const sleepDuration = calculateSleepDuration(bedTime.value, wakeTime.value);

        // 构建日记数据
        const diaryEntry = {
            date: diaryDate.value,
            bedTime: bedTime.value,
            wakeTime: wakeTime.value,
            fallAsleepTime: parseInt(fallAsleepTime.value),
            wakeCount: parseInt(wakeCount.value),
            quality: parseInt(qualityInput.value),
            mood: moodInput.value,
            notes: notesInput.value,
            sleepDuration: sleepDuration,
            timestamp: Date.now()
        };

        // 保存数据
        saveDiaryEntry(diaryEntry);

        // 清空表单
        clearForm();

        // 重新加载数据
        loadData();

        // 提示成功
        alert('日记保存成功！');
    }

    // 计算睡眠时长（小时）
    function calculateSleepDuration(bedTimeStr, wakeTimeStr) {
        const [bedHour, bedMin] = bedTimeStr.split(':').map(Number);
        const [wakeHour, wakeMin] = wakeTimeStr.split(':').map(Number);

        let bedMinutes = bedHour * 60 + bedMin;
        let wakeMinutes = wakeHour * 60 + wakeMin;

        // 如果起床时间小于上床时间，说明跨越了午夜
        if (wakeMinutes < bedMinutes) {
            wakeMinutes += 24 * 60;
        }

        const totalMinutes = wakeMinutes - bedMinutes;
        return (totalMinutes / 60).toFixed(1);
    }

    // 保存日记条目
    function saveDiaryEntry(entry) {
        let diaries = getDiaries();

        // 检查是否已存在该日期的记录
        const existingIndex = diaries.findIndex(d => d.date === entry.date);

        if (existingIndex >= 0) {
            // 更新现有记录
            diaries[existingIndex] = entry;
        } else {
            // 添加新记录
            diaries.push(entry);
        }

        // 按日期降序排序
        diaries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 保存到localStorage
        localStorage.setItem('sleepDiaries', JSON.stringify(diaries));
    }

    // 获取所有日记
    function getDiaries() {
        const data = localStorage.getItem('sleepDiaries');
        return data ? JSON.parse(data) : [];
    }

    // 清空表单
    function clearForm() {
        diaryForm.reset();
        const today = new Date().toISOString().split('T')[0];
        diaryDate.value = today;
        ratingBtns.forEach(b => b.classList.remove('active'));
        moodBtns.forEach(b => b.classList.remove('active'));
        qualityInput.value = '';
        moodInput.value = '';
    }

    // 加载数据
    function loadData() {
        const diaries = getDiaries();
        updateStats(diaries);
        renderCharts(diaries);
        renderHistory('all');
    }

    // 更新统计数据
    function updateStats(diaries) {
        const totalDays = diaries.length;
        document.getElementById('totalDays').textContent = totalDays;

        if (totalDays > 0) {
            // 平均睡眠时长
            const avgSleep = diaries.reduce((sum, d) => sum + parseFloat(d.sleepDuration), 0) / totalDays;
            document.getElementById('avgSleep').textContent = avgSleep.toFixed(1) + 'h';

            // 平均睡眠质量
            const avgQuality = diaries.reduce((sum, d) => sum + d.quality, 0) / totalDays;
            document.getElementById('avgQuality').textContent = avgQuality.toFixed(1) + '分';

            // 计算连续打卡天数
            const streakDays = calculateStreak(diaries);
            document.getElementById('streakDays').textContent = streakDays + '天';
        } else {
            document.getElementById('avgSleep').textContent = '0h';
            document.getElementById('avgQuality').textContent = '0分';
            document.getElementById('streakDays').textContent = '0天';
        }
    }

    // 计算连续打卡天数
    function calculateStreak(diaries) {
        if (diaries.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 按日期降序排列
        const sortedDiaries = [...diaries].sort((a, b) => new Date(b.date) - new Date(a.date));

        for (let i = 0; i < sortedDiaries.length; i++) {
            const entryDate = new Date(sortedDiaries[i].date);
            entryDate.setHours(0, 0, 0, 0);

            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);

            if (entryDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    // 渲染图表
    function renderCharts(diaries) {
        // 获取最近7天的数据
        const recent7Days = diaries.slice(0, 7).reverse();

        if (recent7Days.length === 0) {
            // 如果没有数据，显示空状态
            return;
        }

        const dates = recent7Days.map(d => formatDate(d.date));
        const sleepDurations = recent7Days.map(d => parseFloat(d.sleepDuration));
        const qualities = recent7Days.map(d => d.quality);
        const fallAsleepTimes = recent7Days.map(d => d.fallAsleepTime);

        // 图表通用配置
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };

        // 睡眠时长图表
        const durationCtx = document.getElementById('sleepDurationChart');
        if (sleepDurationChart) sleepDurationChart.destroy();
        sleepDurationChart = new Chart(durationCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: '睡眠时长(小时)',
                    data: sleepDurations,
                    borderColor: '#7FA59A',
                    backgroundColor: 'rgba(127, 165, 154, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: commonOptions
        });

        // 睡眠质量图表
        const qualityCtx = document.getElementById('sleepQualityChart');
        if (sleepQualityChart) sleepQualityChart.destroy();
        sleepQualityChart = new Chart(qualityCtx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: '睡眠质量(分)',
                    data: qualities,
                    backgroundColor: '#7FA59A',
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });

        // 入睡时间图表
        const fallAsleepCtx = document.getElementById('fallAsleepChart');
        if (fallAsleepChart) fallAsleepChart.destroy();
        fallAsleepChart = new Chart(fallAsleepCtx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: '入睡用时(分钟)',
                    data: fallAsleepTimes,
                    backgroundColor: '#6B8E84',
                }]
            },
            options: commonOptions
        });
    }

    // 渲染历史记录
    function renderHistory(filter) {
        const diaries = getDiaries();
        let filteredDiaries = diaries;

        // 根据筛选条件过滤
        if (filter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            filteredDiaries = diaries.filter(d => new Date(d.date) >= weekAgo);
        } else if (filter === 'month') {
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            filteredDiaries = diaries.filter(d => new Date(d.date) >= monthAgo);
        }

        const historyList = document.getElementById('historyList');

        if (filteredDiaries.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>还没有记录哦</p>
                    <p class="empty-hint">开始记录你的第一个睡眠日记吧！</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = filteredDiaries.map(diary => {
            const moodEmoji = {
                'tired': '😴',
                'normal': '😐',
                'good': '😊',
                'energetic': '🤩'
            };

            const moodText = {
                'tired': '疲惫',
                'normal': '一般',
                'good': '清爽',
                'energetic': '精力充沛'
            };

            return `
                <div class="history-item">
                    <div class="history-item-header">
                        <span class="history-date">${formatDate(diary.date)}</span>
                        <div class="history-actions">
                            <button onclick="editDiary('${diary.date}')">编辑</button>
                            <button onclick="deleteDiary('${diary.date}')">删除</button>
                        </div>
                    </div>
                    <div class="history-item-content">
                        <div class="history-detail">
                            <span class="history-detail-label">上床时间:</span>
                            <span class="history-detail-value">${diary.bedTime}</span>
                        </div>
                        <div class="history-detail">
                            <span class="history-detail-label">起床时间:</span>
                            <span class="history-detail-value">${diary.wakeTime}</span>
                        </div>
                        <div class="history-detail">
                            <span class="history-detail-label">睡眠时长:</span>
                            <span class="history-detail-value">${diary.sleepDuration}小时</span>
                        </div>
                        <div class="history-detail">
                            <span class="history-detail-label">入睡用时:</span>
                            <span class="history-detail-value">${diary.fallAsleepTime}分钟</span>
                        </div>
                        <div class="history-detail">
                            <span class="history-detail-label">醒来次数:</span>
                            <span class="history-detail-value">${diary.wakeCount}次</span>
                        </div>
                        <div class="history-detail">
                            <span class="history-detail-label">睡眠质量:</span>
                            <span class="history-detail-value">${diary.quality}分</span>
                        </div>
                        <div class="history-detail">
                            <span class="history-detail-label">早晨感觉:</span>
                            <span class="history-detail-value">${moodEmoji[diary.mood]} ${moodText[diary.mood]}</span>
                        </div>
                    </div>
                    ${diary.notes ? `<div class="history-notes">备注：${diary.notes}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // 格式化日期
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekDay = weekDays[date.getDay()];
        return `${month}月${day}日 周${weekDay}`;
    }

    // 全局函数：编辑日记
    window.editDiary = function(date) {
        const diaries = getDiaries();
        const diary = diaries.find(d => d.date === date);

        if (!diary) return;

        // 填充表单
        diaryDate.value = diary.date;
        bedTime.value = diary.bedTime;
        wakeTime.value = diary.wakeTime;
        fallAsleepTime.value = diary.fallAsleepTime;
        wakeCount.value = diary.wakeCount;
        notesInput.value = diary.notes || '';

        // 设置评分
        ratingBtns.forEach(btn => {
            if (btn.getAttribute('data-value') == diary.quality) {
                btn.classList.add('active');
                qualityInput.value = diary.quality;
            } else {
                btn.classList.remove('active');
            }
        });

        // 设置心情
        moodBtns.forEach(btn => {
            if (btn.getAttribute('data-value') === diary.mood) {
                btn.classList.add('active');
                moodInput.value = diary.mood;
            } else {
                btn.classList.remove('active');
            }
        });

        // 滚动到表单
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    };

    // 全局函数：删除日记
    window.deleteDiary = function(date) {
        if (!confirm('确定要删除这条记录吗？')) return;

        let diaries = getDiaries();
        diaries = diaries.filter(d => d.date !== date);
        localStorage.setItem('sleepDiaries', JSON.stringify(diaries));

        loadData();
        alert('记录已删除');
    };
});
