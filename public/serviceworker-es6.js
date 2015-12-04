const version = 111;

importScripts('/js/serviceworker-cache-polyfill.js');

const cacheNameStatic = 'jot-static-v' + version;
const cacheNameGoogleAvatar = 'jot-google-avatar-v' + version;

const currentCacheNames = [
  cacheNameStatic,
  cacheNameGoogleAvatar,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheNameStatic)
      .then(cache => {
        return cache.addAll([
          '/',
          '/css/app.css',
          '/js/dist/app.js',
          '/js/browser-polyfill.js',
          '/js/pouchdb.js',
          //'/js/webfontloader.js',
        ]);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (currentCacheNames.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  const selfURL = self.location;
  const requestURL = new URL(event.request.url);

  if (requestURL.pathname.indexOf('/auth/') === 0 && requestURL.pathname !== '/auth/user') {
    return;
  }

  // if no extension, assume it's a page (not root)
  if (selfURL.host === requestURL.host && requestURL.pathname.indexOf('.') === -1 && requestURL.pathname !== '/auth/user') {
    event.respondWith(caches.match('/').then(cacheResponse => {
      return cacheResponse;
    }, err => {
      console.log('sw match error: ', err);
    }));
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }

          const fetchRequest = event.request.clone();

          return fetch(fetchRequest).then(fetchResponse => {
            let shouldCache = false;

            if (fetchResponse.type === 'basic' && fetchResponse.status === 200) {
              // shouldCache = cacheNameStatic;
            } else if (fetchResponse.type === 'opaque') { // if response isn't from our origin / doesn't support CORS
              if (requestURL.hostname.indexOf('.googleusercontent.com') > -1) {
                shouldCache = cacheNameGoogleAvatar;
              } else {
                // just let response pass through, don't cache
              }
            }

            if (shouldCache) {
              const responseToCache = fetchResponse.clone();

              caches.open(shouldCache)
                .then(cache => {
                  const cacheRequest = event.request.clone();
                  cache.put(cacheRequest, responseToCache);
                });
            }

            return fetchResponse;
          }, err => {
            console.log('sw fetch error: ', err);
            if (requestURL.pathname === '/auth/user') {
              return new Response(JSON.stringify({
                serviceworker: true,
              }, {
                headers: { 'Content-Type': 'application/json' },
              }));
            }

            if (requestURL.origin === location.origin) {
              return caches.match('/');
            }
          });
        })
    );
  }
});
