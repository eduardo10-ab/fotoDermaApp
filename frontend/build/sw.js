/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

// public/sw.js - Service Worker para FotoDerma PWA

const CACHE_NAME = 'fotoderma-v2'; // Incrementé la versión para forzar actualización
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache abierto');
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('Service Worker: Error al cachear archivos:', error);
          // No falla completamente si algunos archivos no se pueden cachear
          return Promise.resolve();
        });
      })
  );
  // Fuerza al service worker a activarse inmediatamente
  self.skipWaiting();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Solo interceptar requests HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si está en cache, devolverlo
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no está en cache, hacer fetch a la red
        return fetch(event.request.clone())
          .then((response) => {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Solo cachear requests GET
            if (event.request.method === 'GET') {
              // Clonar la respuesta para cachearla
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.warn('Service Worker: Error al cachear:', error);
                });
            }

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Error en fetch:', error);
            // Si falla la red y es una navegación, mostrar página offline
            if (event.request.destination === 'document') {
              return caches.match('/').then((response) => {
                return response || new Response('App offline', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
              });
            }
            throw error;
          });
      })
  );
});

// Actualizar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
            return null;
          }).filter(Boolean)
        );
      })
      .then(() => {
        console.log('Service Worker: Activado correctamente');
        // Toma control inmediatamente de todas las páginas
        return self.clients.claim();
      })
  );
});

// Manejar errores
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error:', event.error);
});

// Manejar errores de promesas no capturadas
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Promesa rechazada:', event.reason);
});