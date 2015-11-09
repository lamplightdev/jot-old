// v:2
importScripts('/js/serviceworker-cache-polyfill.js');

var cacheNameStatic = 'jot-static-v1';
var cacheNameGoogleAvatar = 'jot-google-avatar-v1';

var currentCacheNames = [
  cacheNameStatic,
  cacheNameGoogleAvatar
];

self.addEventListener('install', function (event) {
  console.log('sw installed');

  event.waitUntil(
    caches.open(cacheNameStatic)
      .then(function (cache) {
        return cache.addAll([
          '/',
          '/css/app.css',
          '/js/dist/app.js',
          '/js/browser-polyfill.js',
          '/js/pouchdb.js',
          '/js/webfontloader.js'
        ]);
      })
  );
});

self.addEventListener('activate', function (event) {
  console.log('sw active');

  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (currentCacheNames.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

self.addEventListener('fetch', function (event) {
  var requestURL = new URL(event.request.url);

  if (requestURL.pathname.indexOf('/auth/') === 0) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function (response) {

        if (response) {
          return response;
        }

        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function (response) {

            var shouldCache = false;

            if (response.type === 'basic' && response.status === 200) {
              //shouldCache = cacheNameStatic;
            } else if (response.type === 'opaque') { // if response isn't from our origin / doesn't support CORS
              if (requestURL.hostname.indexOf('.googleusercontent.com') > -1) {
                shouldCache = cacheNameGoogleAvatar;
              } else {
                // just let response pass through, don't cache
              }

            }

            if (shouldCache) {
              var responseToCache = response.clone();

              caches.open(shouldCache)
                .then(function (cache) {
                  var cacheRequest = event.request.clone();
                  cache.put(cacheRequest, responseToCache);
                });
            }

            return response;
          }
        ).catch(function (err) {
          console.log('sw fetch error: ', err);
          if (requestURL.origin === location.origin) {
            return caches.match('/');
          }
        });
      })
  );
});
