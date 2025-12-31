// PWA 注册和安装提示

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker 注册成功:', registration.scope);

        // 检查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 发现新版本');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新版本已安装，提示用户刷新
              showUpdateNotification();
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Service Worker 注册失败:', error);
      });
  });
}

// 安装提示
let deferredPrompt;
const installButton = document.getElementById('installBtn');
const installBanner = document.getElementById('installBanner');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('💡 可以安装 PWA');
  // 阻止默认的安装提示
  e.preventDefault();
  // 保存事件，稍后触发
  deferredPrompt = e;

  // 显示自定义安装横幅
  if (installBanner) {
    installBanner.style.display = 'flex';
  }
});

// 点击安装按钮
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      console.log('安装提示已被使用');
      return;
    }

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`用户选择: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('✅ 用户接受了安装');
    } else {
      console.log('❌ 用户拒绝了安装');
    }

    // 清除保存的事件
    deferredPrompt = null;

    // 隐藏安装横幅
    if (installBanner) {
      installBanner.style.display = 'none';
    }
  });
}

// 关闭安装横幅
const closeBannerBtn = document.getElementById('closeBannerBtn');
if (closeBannerBtn) {
  closeBannerBtn.addEventListener('click', () => {
    if (installBanner) {
      installBanner.style.display = 'none';
    }
    // 记住用户关闭了横幅，24小时内不再显示
    localStorage.setItem('installBannerClosed', Date.now());
  });
}

// 检查是否应该显示安装横幅
window.addEventListener('load', () => {
  const lastClosed = localStorage.getItem('installBannerClosed');
  if (lastClosed) {
    const hoursSinceClosed = (Date.now() - parseInt(lastClosed)) / (1000 * 60 * 60);
    if (hoursSinceClosed < 24) {
      // 24小时内关闭过，不显示
      if (installBanner) {
        installBanner.style.display = 'none';
      }
    }
  }
});

// 应用安装后
window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA 安装成功！');
  // 隐藏安装横幅
  if (installBanner) {
    installBanner.style.display = 'none';
  }
  // 可以发送分析事件
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_installed');
  }
});

// 显示更新通知
function showUpdateNotification() {
  // 创建更新提示
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <span>🎉 新版本可用！</span>
      <button class="btn-primary" onclick="window.location.reload()">立即更新</button>
      <button class="btn-secondary" onclick="this.parentElement.parentElement.remove()">稍后</button>
    </div>
  `;
  document.body.appendChild(notification);

  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .update-notification {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideUp 0.3s ease;
    }
    .update-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .update-content button {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
    }
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

// 检测是否在 PWA 模式下运行
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// 如果在 PWA 模式下运行，添加特殊样式
if (isPWA()) {
  document.documentElement.classList.add('pwa-mode');
  console.log('🚀 运行在 PWA 模式');
}

// 离线/在线状态检测
window.addEventListener('online', () => {
  console.log('🌐 网络已连接');
  showConnectionStatus('已连接到网络', 'success');
});

window.addEventListener('offline', () => {
  console.log('📡 网络已断开');
  showConnectionStatus('离线模式 - 部分功能可能不可用', 'warning');
});

function showConnectionStatus(message, type) {
  const toast = document.createElement('div');
  toast.className = `connection-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);

  // 添加样式
  if (!document.getElementById('connection-toast-style')) {
    const style = document.createElement('style');
    style.id = 'connection-toast-style';
    style.textContent = `
      .connection-toast {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
        pointer-events: none;
      }
      .connection-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      .connection-toast.success {
        background: #7FA59A;
        color: white;
      }
      .connection-toast.warning {
        background: #B08968;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
}
