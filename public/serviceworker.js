(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var version = "358";

importScripts('/js/serviceworker-cache-polyfill.js');

var cacheNameStatic = 'jot-static-v' + version;
var cacheNameGoogleAvatar = 'jot-google-avatar-v' + version;

var currentCacheNames = [cacheNameStatic, cacheNameGoogleAvatar];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(cacheNameStatic).then(function (cache) {
    return cache.addAll(['/', '/css/app.css', '/js/dist/app.js', '/js/browser-polyfill.js', '/js/pouchdb.js']);
  }));
});

// '/js/webfontloader.js',
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.map(function (cacheName) {
      if (currentCacheNames.indexOf(cacheName) === -1) {
        return caches.delete(cacheName);
      }
    }));
  }).then(function (promises) {
    // localStorage.setItem('sw-version', version);
    return promises;
  }));
});

self.addEventListener('fetch', function (event) {
  var selfURL = self.location;
  var requestURL = new URL(event.request.url);

  if (requestURL.pathname.indexOf('/auth/') === 0 && requestURL.pathname !== '/auth/user') {
    return;
  }

  // if no extension, assume it's a page (not root)
  if (selfURL.host === requestURL.host && requestURL.pathname.indexOf('.') === -1 && requestURL.pathname !== '/auth/user') {
    event.respondWith(caches.match('/').then(function (cacheResponse) {
      return cacheResponse;
    }, function (err) {
      console.log('sw match error: ', err);
    }));
  } else {
    event.respondWith(caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      }

      var fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(function (fetchResponse) {
        var shouldCache = false;

        if (fetchResponse.type === 'basic' && fetchResponse.status === 200) {
          // shouldCache = cacheNameStatic;
        } else if (fetchResponse.type === 'opaque') {
            // if response isn't from our origin / doesn't support CORS
            if (requestURL.hostname.indexOf('.googleusercontent.com') > -1) {
              shouldCache = cacheNameGoogleAvatar;
            } else {
              // just let response pass through, don't cache
            }
          }

        if (shouldCache) {
          (function () {
            var responseToCache = fetchResponse.clone();

            caches.open(shouldCache).then(function (cache) {
              var cacheRequest = event.request.clone();
              cache.put(cacheRequest, responseToCache);
            });
          })();
        }

        return fetchResponse;
      }, function (err) {
        console.log('sw fetch error: ', err);
        if (requestURL.pathname === '/auth/user') {
          return new Response(JSON.stringify({
            serviceworker: true
          }, {
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        if (requestURL.origin === location.origin) {
          return caches.match('/');
        }
      });
    }));
  }
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvc2VydmljZXdvcmtlci1lczYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUM7O0FBRTFELGFBQWEsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDOztBQUVyRCxJQUFNLGVBQWUsR0FBRyxjQUFjLEdBQUcsT0FBTyxDQUFDO0FBQ2pELElBQU0scUJBQXFCLEdBQUcscUJBQXFCLEdBQUcsT0FBTyxDQUFDOztBQUU5RCxJQUFNLGlCQUFpQixHQUFHLENBQ3hCLGVBQWUsRUFDZixxQkFBcUIsQ0FDdEIsQ0FBQzs7QUFFRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFVBQUEsS0FBSyxFQUFJO0FBQ3hDLE9BQUssQ0FBQyxTQUFTLENBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FDekIsSUFBSSxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ2IsV0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQ2xCLEdBQUcsRUFDSCxjQUFjLEVBQ2QsaUJBQWlCLEVBQ2pCLHlCQUF5QixFQUN6QixnQkFBZ0IsQ0FFakIsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUNMLENBQUM7Q0FDSCxDQUFDLENBQUM7OztBQUVILElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDekMsT0FBSyxDQUFDLFNBQVMsQ0FDYixNQUFNLENBQUMsSUFBSSxFQUFFLENBQ1YsSUFBSSxDQUFDLFVBQUEsVUFBVSxFQUFJO0FBQ2xCLFdBQU8sT0FBTyxDQUFDLEdBQUcsQ0FDaEIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFBLFNBQVMsRUFBSTtBQUMxQixVQUFJLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUMv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Q2pDLHlCQUFhLEVBQUUsSUFBSTtXQUNwQixFQUFFO0FBQ0QsbUJBQU8sRUFBRSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRTtXQUNoRCxDQUFDLENBQUMsQ0FBQztTQUNMOztBQUVELFlBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUMsTUFBTSxFQUFFO0FBQ3pDLGlCQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDMUI7T0FDRixDQUFDLENBQUM7S0FDSixDQUFDLENBQ0wsQ0FBQztHQUNIO0NBQ0YsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IHZlcnNpb24gPSBwcm9jZXNzLmVudi5ucG1fcGFja2FnZV9jb25maWdfc3dfdmVyc2lvbjtcblxuaW1wb3J0U2NyaXB0cygnL2pzL3NlcnZpY2V3b3JrZXItY2FjaGUtcG9seWZpbGwuanMnKTtcblxuY29uc3QgY2FjaGVOYW1lU3RhdGljID0gJ2pvdC1zdGF0aWMtdicgKyB2ZXJzaW9uO1xuY29uc3QgY2FjaGVOYW1lR29vZ2xlQXZhdGFyID0gJ2pvdC1nb29nbGUtYXZhdGFyLXYnICsgdmVyc2lvbjtcblxuY29uc3QgY3VycmVudENhY2hlTmFtZXMgPSBbXG4gIGNhY2hlTmFtZVN0YXRpYyxcbiAgY2FjaGVOYW1lR29vZ2xlQXZhdGFyLFxuXTtcblxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZXZlbnQgPT4ge1xuICBldmVudC53YWl0VW50aWwoXG4gICAgY2FjaGVzLm9wZW4oY2FjaGVOYW1lU3RhdGljKVxuICAgICAgLnRoZW4oY2FjaGUgPT4ge1xuICAgICAgICByZXR1cm4gY2FjaGUuYWRkQWxsKFtcbiAgICAgICAgICAnLycsXG4gICAgICAgICAgJy9jc3MvYXBwLmNzcycsXG4gICAgICAgICAgJy9qcy9kaXN0L2FwcC5qcycsXG4gICAgICAgICAgJy9qcy9icm93c2VyLXBvbHlmaWxsLmpzJyxcbiAgICAgICAgICAnL2pzL3BvdWNoZGIuanMnLFxuICAgICAgICAgIC8vICcvanMvd2ViZm9udGxvYWRlci5qcycsXG4gICAgICAgIF0pO1xuICAgICAgfSlcbiAgKTtcbn0pO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2FjdGl2YXRlJywgZXZlbnQgPT4ge1xuICBldmVudC53YWl0VW50aWwoXG4gICAgY2FjaGVzLmtleXMoKVxuICAgICAgLnRoZW4oY2FjaGVOYW1lcyA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgICBjYWNoZU5hbWVzLm1hcChjYWNoZU5hbWUgPT4ge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDYWNoZU5hbWVzLmluZGV4T2YoY2FjaGVOYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlcy5kZWxldGUoY2FjaGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfSlcbiAgICAgIC50aGVuKHByb21pc2VzID0+IHtcbiAgICAgICAgLy8gbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3N3LXZlcnNpb24nLCB2ZXJzaW9uKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2VzO1xuICAgICAgfSlcbiAgKTtcbn0pO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2ZldGNoJywgZXZlbnQgPT4ge1xuICBjb25zdCBzZWxmVVJMID0gc2VsZi5sb2NhdGlvbjtcbiAgY29uc3QgcmVxdWVzdFVSTCA9IG5ldyBVUkwoZXZlbnQucmVxdWVzdC51cmwpO1xuXG4gIGlmIChyZXF1ZXN0VVJMLnBhdGhuYW1lLmluZGV4T2YoJy9hdXRoLycpID09PSAwICYmIHJlcXVlc3RVUkwucGF0aG5hbWUgIT09ICcvYXV0aC91c2VyJykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmIG5vIGV4dGVuc2lvbiwgYXNzdW1lIGl0J3MgYSBwYWdlIChub3Qgcm9vdClcbiAgaWYgKHNlbGZVUkwuaG9zdCA9PT0gcmVxdWVzdFVSTC5ob3N0ICYmIHJlcXVlc3RVUkwucGF0aG5hbWUuaW5kZXhPZignLicpID09PSAtMSAmJiByZXF1ZXN0VVJMLnBhdGhuYW1lICE9PSAnL2F1dGgvdXNlcicpIHtcbiAgICBldmVudC5yZXNwb25kV2l0aChjYWNoZXMubWF0Y2goJy8nKS50aGVuKGNhY2hlUmVzcG9uc2UgPT4ge1xuICAgICAgcmV0dXJuIGNhY2hlUmVzcG9uc2U7XG4gICAgfSwgZXJyID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdzdyBtYXRjaCBlcnJvcjogJywgZXJyKTtcbiAgICB9KSk7XG4gIH0gZWxzZSB7XG4gICAgZXZlbnQucmVzcG9uZFdpdGgoXG4gICAgICBjYWNoZXMubWF0Y2goZXZlbnQucmVxdWVzdClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGZldGNoUmVxdWVzdCA9IGV2ZW50LnJlcXVlc3QuY2xvbmUoKTtcblxuICAgICAgICAgIHJldHVybiBmZXRjaChmZXRjaFJlcXVlc3QpLnRoZW4oZmV0Y2hSZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBsZXQgc2hvdWxkQ2FjaGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKGZldGNoUmVzcG9uc2UudHlwZSA9PT0gJ2Jhc2ljJyAmJiBmZXRjaFJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgIC8vIHNob3VsZENhY2hlID0gY2FjaGVOYW1lU3RhdGljO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmZXRjaFJlc3BvbnNlLnR5cGUgPT09ICdvcGFxdWUnKSB7IC8vIGlmIHJlc3BvbnNlIGlzbid0IGZyb20gb3VyIG9yaWdpbiAvIGRvZXNuJ3Qgc3VwcG9ydCBDT1JTXG4gICAgICAgICAgICAgIGlmIChyZXF1ZXN0VVJMLmhvc3RuYW1lLmluZGV4T2YoJy5nb29nbGV1c2VyY29udGVudC5jb20nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkQ2FjaGUgPSBjYWNoZU5hbWVHb29nbGVBdmF0YXI7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8ganVzdCBsZXQgcmVzcG9uc2UgcGFzcyB0aHJvdWdoLCBkb24ndCBjYWNoZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzaG91bGRDYWNoZSkge1xuICAgICAgICAgICAgICBjb25zdCByZXNwb25zZVRvQ2FjaGUgPSBmZXRjaFJlc3BvbnNlLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgY2FjaGVzLm9wZW4oc2hvdWxkQ2FjaGUpXG4gICAgICAgICAgICAgICAgLnRoZW4oY2FjaGUgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgY2FjaGVSZXF1ZXN0ID0gZXZlbnQucmVxdWVzdC5jbG9uZSgpO1xuICAgICAgICAgICAgICAgICAgY2FjaGUucHV0KGNhY2hlUmVxdWVzdCwgcmVzcG9uc2VUb0NhY2hlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZldGNoUmVzcG9uc2U7XG4gICAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdyBmZXRjaCBlcnJvcjogJywgZXJyKTtcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0VVJMLnBhdGhuYW1lID09PSAnL2F1dGgvdXNlcicpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgc2VydmljZXdvcmtlcjogdHJ1ZSxcbiAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXF1ZXN0VVJMLm9yaWdpbiA9PT0gbG9jYXRpb24ub3JpZ2luKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWNoZXMubWF0Y2goJy8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICApO1xuICB9XG59KTtcbiJdfQ==
