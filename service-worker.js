// 🎯 Habit Tracker PWA - Service Worker
// Version 2.0 - Full offline support

const CACHE_VERSION = 'habit-tracker-v2.0.0';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_API = `${CACHE_VERSION}-api`;

// Файлы для кэширования при установке
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/java.js',
  '/css.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Максимальный размер динамического кэша
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_API_CACHE_SIZE = 100;

// ============================================
// INSTALL - Установка и кэширование статики
// ============================================
self.addEventListener('install', (event) => {
  console.log('🚀 [SW] Установка Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('📦 [SW] Кэширование статических файлов...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ [SW] Статика закэширована!');
        return self.skipWaiting(); // Активировать немедленно
      })
      .catch((error) => {
        console.error('❌ [SW] Ошибка кэширования:', error);
      })
  );
});

// ============================================
// ACTIVATE - Очистка старых кэшей
// ============================================
self.addEventListener('activate', (event) => {
  console.log('⚡ [SW] Активация Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Удаляем старые версии кэша
              return name.startsWith('habit-tracker-') && 
                     name !== CACHE_STATIC && 
                     name !== CACHE_DYNAMIC &&
                     name !== CACHE_API;
            })
            .map((name) => {
              console.log('🗑️ [SW] Удаление старого кэша:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ [SW] Service Worker активирован!');
        return self.clients.claim(); // Захватить все клиенты
      })
  );
});

// ============================================
// FETCH - Стратегии кэширования
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API запросы - Network First (сеть приоритетнее)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, CACHE_API, MAX_API_CACHE_SIZE));
    return;
  }

  // Статические файлы - Cache First (кэш приоритетнее)
  if (request.method === 'GET') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // POST/PUT/DELETE - только сеть
  event.respondWith(fetch(request));
});

// ============================================
// СТРАТЕГИЯ: Cache First (для статики)
// ============================================
async function cacheFirstStrategy(request) {
  try {
    // Проверяем статический кэш
    const staticCache = await caches.open(CACHE_STATIC);
    let response = await staticCache.match(request);
    
    if (response) {
      console.log('💾 [SW] Из статического кэша:', request.url);
      return response;
    }

    // Проверяем динамический кэш
    const dynamicCache = await caches.open(CACHE_DYNAMIC);
    response = await dynamicCache.match(request);
    
    if (response) {
      console.log('💾 [SW] Из динамического кэша:', request.url);
      return response;
    }

    // Загружаем из сети
    console.log('🌐 [SW] Загрузка из сети:', request.url);
    const networkResponse = await fetch(request);
    
    // Кэшируем успешные GET запросы
    if (networkResponse.ok && request.method === 'GET') {
      const responseClone = networkResponse.clone();
      dynamicCache.put(request, responseClone);
      limitCacheSize(CACHE_DYNAMIC, MAX_DYNAMIC_CACHE_SIZE);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ [SW] Ошибка загрузки:', error);
    
    // Возвращаем офлайн страницу для HTML
    if ((request.headers.get('accept') || '').includes('text/html')) {
      return new Response(
        `<!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Офлайн - Habit Tracker</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            h1 { font-size: 3rem; margin: 0; }
            p { font-size: 1.2rem; opacity: 0.9; }
            button {
              margin-top: 2rem;
              padding: 1rem 2rem;
              font-size: 1rem;
              background: white;
              color: #667eea;
              border: none;
              border-radius: 50px;
              cursor: pointer;
              font-weight: bold;
            }
            button:hover { transform: scale(1.05); }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📡 Нет соединения</h1>
            <p>Проверьте подключение к интернету</p>
            <button onclick="location.reload()">🔄 Попробовать снова</button>
          </div>
        </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
          status: 200
        }
      );
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// ============================================
// СТРАТЕГИЯ: Network First (для API)
// ============================================
async function networkFirstStrategy(request, cacheName, maxSize) {
  try {
    // Пробуем загрузить из сети
    console.log('🌐 [SW] API запрос:', request.url);
    const networkResponse = await fetch(request);
    
    // Кэшируем успешные GET запросы
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      limitCacheSize(cacheName, maxSize);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('⚠️ [SW] Сеть недоступна, пробуем кэш:', request.url);
    
    // Если сеть недоступна, возвращаем из кэша
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('💾 [SW] Из API кэша:', request.url);
      return cachedResponse;
    }
    
    // Если и кэша нет, возвращаем ошибку
    return new Response(
      JSON.stringify({ error: 'Нет соединения и нет кэшированных данных' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

// ============================================
// УТИЛИТЫ: Ограничение размера кэша
// ============================================
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    console.log(`🗑️ [SW] Очистка кэша ${cacheName}: ${keys.length}/${maxSize}`);
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, maxSize);
  }
}

// ============================================
// BACKGROUND SYNC - для офлайн действий
// ============================================
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-habits') {
    event.waitUntil(syncHabits());
  }
});

async function syncHabits() {
  try {
    console.log('🔄 [SW] Синхронизация привычек...');
    // Здесь можно добавить логику синхронизации офлайн изменений
    // Например, отправить сохранённые в IndexedDB изменения
  } catch (error) {
    console.error('❌ [SW] Ошибка синхронизации:', error);
  }
}

// ============================================
// PUSH NOTIFICATIONS - уведомления
// ============================================
self.addEventListener('push', (event) => {
  console.log('📬 [SW] Push уведомление получено');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Habit Tracker';
  const options = {
    body: data.body || 'Время выполнить привычку!',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    tag: 'habit-reminder',
    requireInteraction: false,
    actions: [
      { action: 'complete', title: '✅ Выполнено' },
      { action: 'later', title: '⏰ Позже' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Клик по уведомлению:', event.action);
  
  event.notification.close();
  
  if (event.action === 'complete') {
    // Отметить привычку выполненной
    event.waitUntil(
      clients.openWindow('/?action=complete')
    );
  } else if (event.action === 'later') {
    // Отмістити нагадування
    console.log('⏰ Нагадування відкладене');
  } else {
    // Просто открыть приложение
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// ============================================
// СООБЩЕНИЯ от клиента
// ============================================
self.addEventListener('message', (event) => {
  console.log('💬 [SW] Сообщение от клиента:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

console.log('✅ [SW] Service Worker загружен!');