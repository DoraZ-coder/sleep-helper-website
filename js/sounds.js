// 舒眠声景音乐播放器

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const loopBtn = document.getElementById('loopBtn');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeRange = document.getElementById('volumeRange');
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const progressHandle = document.querySelector('.progress-handle');
    const timeCurrent = document.querySelector('.time-current');
    const timeTotal = document.querySelector('.time-total');

    // 播放列表相关元素
    const collectionItems = document.querySelectorAll('.collection-item');
    const trackItems = document.querySelectorAll('.track-item');

    // 当前播放信息显示
    const currentTrackName = document.querySelector('.current-track-name');
    const currentCollectionName = document.querySelector('.current-collection-name');
    const controlsTrackName = document.querySelector('.controls-track-name');
    const controlsCollectionName = document.querySelector('.controls-collection-name');

    // 播放状态
    let currentTrackIndex = -1;
    let playlist = Array.from(trackItems);
    let isPlaying = false;
    let loopMode = 'none'; // 'one' = 单曲循环, 'none' = 顺序播放
    let isDragging = false; // 是否正在拖动进度条
    let volumeBeforeDrag = 0; // 拖动前的音量

    // 初始化
    init();

    function init() {
        // 设置初始音量
        audioPlayer.volume = volumeRange.value / 100;

        // 合集展开/收起功能
        collectionItems.forEach(item => {
            const header = item.querySelector('.collection-header');
            header.addEventListener('click', function() {
                item.classList.toggle('expanded');
            });
        });

        // 默认展开第一个合集
        if (collectionItems.length > 0) {
            collectionItems[0].classList.add('expanded');
        }

        // 为每个曲目添加点击事件
        trackItems.forEach((track, index) => {
            track.addEventListener('click', function() {
                playTrack(index);
            });
        });

        // 加载音频时长
        loadAllDurations();

        // 绑定控制按钮事件
        playPauseBtn.addEventListener('click', togglePlayPause);
        prevBtn.addEventListener('click', playPrevious);
        nextBtn.addEventListener('click', playNext);
        loopBtn.addEventListener('click', toggleLoopMode);
        volumeBtn.addEventListener('click', toggleMute);
        volumeRange.addEventListener('input', changeVolume);

        // 进度条拖动
        progressBar.addEventListener('click', seekAudio);
        progressBar.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        // 移动端触摸支持
        progressBar.addEventListener('touchstart', startDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', stopDrag);

        // 音频事件监听
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('ended', handleTrackEnd);
        audioPlayer.addEventListener('loadedmetadata', updateTotalTime);
    }

    // 播放指定曲目
    function playTrack(index) {
        if (index < 0 || index >= playlist.length) return;

        currentTrackIndex = index;
        const track = playlist[index];
        const trackSrc = track.getAttribute('data-src');
        const trackName = track.querySelector('.track-name').textContent;
        const collectionName = track.closest('.collection-item').getAttribute('data-collection');

        // 更新音频源
        audioPlayer.src = trackSrc;
        audioPlayer.load();
        audioPlayer.play();
        isPlaying = true;

        // 更新UI
        updatePlayingState(track);
        updateTrackInfo(trackName, collectionName);
        updatePlayPauseButton();
    }

    // 更新播放状态UI
    function updatePlayingState(activeTrack) {
        // 移除所有playing类
        trackItems.forEach(item => item.classList.remove('playing'));
        // 添加到当前播放的曲目
        if (activeTrack) {
            activeTrack.classList.add('playing');
        }
    }

    // 更新曲目信息显示
    function updateTrackInfo(trackName, collectionName) {
        currentTrackName.textContent = trackName;
        currentCollectionName.textContent = collectionName;
        controlsTrackName.textContent = trackName;
        controlsCollectionName.textContent = collectionName;
    }

    // 播放/暂停切换
    function togglePlayPause() {
        if (currentTrackIndex === -1) {
            // 如果还没有播放任何曲目，播放第一首
            playTrack(0);
            return;
        }

        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
        } else {
            audioPlayer.play();
            isPlaying = true;
        }

        updatePlayPauseButton();
    }

    // 更新播放/暂停按钮图标
    function updatePlayPauseButton() {
        const icon = playPauseBtn.querySelector('i');
        if (isPlaying) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            playPauseBtn.setAttribute('title', '暂停');
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            playPauseBtn.setAttribute('title', '播放');
        }
    }

    // 播放上一曲
    function playPrevious() {
        if (currentTrackIndex > 0) {
            playTrack(currentTrackIndex - 1);
        }
    }

    // 播放下一曲
    function playNext() {
        if (currentTrackIndex < playlist.length - 1) {
            playTrack(currentTrackIndex + 1);
        }
    }

    // 切换循环模式
    function toggleLoopMode() {
        if (loopMode === 'none') {
            loopMode = 'one';
        } else {
            loopMode = 'none';
        }

        // 更新按钮状态
        const icon = loopBtn.querySelector('i');
        loopBtn.classList.remove('active');

        if (loopMode === 'one') {
            loopBtn.setAttribute('title', '单曲循环');
            icon.className = 'fas fa-redo';
            loopBtn.classList.add('active');
        } else {
            loopBtn.setAttribute('title', '顺序播放');
            icon.className = 'fas fa-arrow-right';
        }
    }

    // 曲目播放结束处理
    function handleTrackEnd() {
        if (loopMode === 'one') {
            // 单曲循环
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            // 顺序播放
            if (currentTrackIndex < playlist.length - 1) {
                playNext();
            } else {
                // 播放完最后一首，停止
                isPlaying = false;
                updatePlayPauseButton();
            }
        }
    }

    // 更新进度条
    function updateProgress() {
        if (!audioPlayer.duration || isDragging) return; // 拖动时不自动更新

        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = percent + '%';
        progressHandle.style.left = percent + '%';

        timeCurrent.textContent = formatTime(audioPlayer.currentTime);
    }

    // 更新总时长
    function updateTotalTime() {
        timeTotal.textContent = formatTime(audioPlayer.duration);
    }

    // 进度条点击跳转
    function seekAudio(e) {
        if (!audioPlayer.duration || isDragging) return;

        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    }

    // 开始拖动进度条
    function startDrag(e) {
        if (!audioPlayer.duration) return;
        e.preventDefault();
        isDragging = true;
        progressBar.style.cursor = 'grabbing';

        // 保存当前音量并静音
        volumeBeforeDrag = audioPlayer.volume;
        audioPlayer.volume = 0;

        updateProgressByEvent(e);
    }

    // 拖动进度条
    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        updateProgressByEvent(e);
    }

    // 停止拖动进度条
    function stopDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        progressBar.style.cursor = 'pointer';

        // 恢复音量
        audioPlayer.volume = volumeBeforeDrag;
    }

    // 根据鼠标/触摸位置更新进度
    function updateProgressByEvent(e) {
        const rect = progressBar.getBoundingClientRect();
        let clientX;

        // 处理触摸事件和鼠标事件
        if (e.type.startsWith('touch')) {
            clientX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX;
        } else {
            clientX = e.clientX;
        }

        // 计算百分比，限制在0-100%之间
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));

        // 更新音频时间、进度条和小圆点
        audioPlayer.currentTime = percent * audioPlayer.duration;
        progressFill.style.width = (percent * 100) + '%';
        progressHandle.style.left = (percent * 100) + '%';
        timeCurrent.textContent = formatTime(audioPlayer.currentTime);
    }

    // 音量控制
    function changeVolume() {
        const volume = volumeRange.value / 100;
        audioPlayer.volume = volume;
        updateVolumeIcon(volume);
    }

    // 静音切换
    function toggleMute() {
        if (audioPlayer.volume > 0) {
            audioPlayer.volume = 0;
            volumeRange.value = 0;
        } else {
            audioPlayer.volume = 0.8;
            volumeRange.value = 80;
        }
        updateVolumeIcon(audioPlayer.volume);
    }

    // 更新音量图标
    function updateVolumeIcon(volume) {
        const icon = volumeBtn.querySelector('i');
        icon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-mute');

        if (volume === 0) {
            icon.classList.add('fa-volume-mute');
        } else if (volume < 0.5) {
            icon.classList.add('fa-volume-down');
        } else {
            icon.classList.add('fa-volume-up');
        }
    }

    // 格式化时间 (秒 -> mm:ss)
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 加载所有音频的时长
    function loadAllDurations() {
        trackItems.forEach(track => {
            const src = track.getAttribute('data-src');
            const durationSpan = track.querySelector('.track-duration');

            // 创建临时音频元素获取时长
            const tempAudio = new Audio(src);
            tempAudio.addEventListener('loadedmetadata', function() {
                durationSpan.textContent = formatTime(tempAudio.duration);
            });
        });
    }

    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        // 空格键：播放/暂停
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            togglePlayPause();
        }
        // 左箭头：上一曲
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            playPrevious();
        }
        // 右箭头：下一曲
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            playNext();
        }
    });
});
