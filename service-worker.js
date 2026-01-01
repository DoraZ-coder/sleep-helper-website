// Service Worker for Easezy PWA
const CACHE_NAME = 'easezy-v2.0.0';
const RUNTIME_CACHE = 'easezy-runtime-v2.0.0';

// 需要预缓存的核心资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/content.html',
  '/sounds.html',
  '/diary.html',
  '/membership.html',
  '/about.html',
  '/assessment.html',
  '/css/style.css',
  '/js/main.js',
  '/js/content.js',
  '/js/sounds.js',
  '/js/diary.js',
  '/js/track.js',
  '/images/logo.png',
  '/manifest.json'
];

// 安装事件 - 预缓存核心资源
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching core resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截 - 缓存策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    // 对于音频文件，使用网络优先策略
    if (request.url.includes('/sounds/')) {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  // HTML页面 - 网络优先，失败时使用缓存
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源（CSS, JS, 图片）- 缓存优先
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // API请求 - 网络优先
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 其他请求 - 网络优先
  event.respondWith(networkFirst(request));
});

// 缓存优先策略（适合静态资源）
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[Service Worker] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    // 如果是导航请求且网络失败，返回离线页面
    if (request.mode === 'navigate') {
      return cache.match('/index.html');
    }
    throw error;
  }
}

// 网络优先策略（适合动态内容）
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // 如果是HTML页面请求，返回离线页面
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/index.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    throw error;
  }
}

// 后台同步（可选，用于离线表单提交）
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-diary') {
    event.waitUntil(syncDiaryData());
  }
});

async function syncDiaryData() {
  // 这里可以实现离线日记数据同步
  console.log('[Service Worker] Syncing diary data...');
}

// 推送通知（可选）
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received');
  const options = {
    body: event.data ? event.data.text() : '该睡觉啦！',
    icon: '/images/icon-192.png',
    badge: '/images/icon-72.png',
    vibrate: [200, 100, 200],
    tag: 'sleep-reminder',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Easezy 提醒', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
