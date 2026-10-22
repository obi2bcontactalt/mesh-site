// MESH service worker: lets the site open from the home screen and read offline.
// build.mjs fills in the version and the list of pages, and writes this to dist/sw.js.
// Pages: the newest copy from the network, the saved copy when there is no signal.
// Everything else (styles, images, fonts, PDFs): the saved copy at once, refreshed in the background.
'use strict';

var VERSION = 'mesh-__VERSION__';
var PRECACHE = __PRECACHE__;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function saveCopy(request, response) {
  if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
    var copy = response.clone();
    caches.open(VERSION).then(function (cache) { cache.put(request, copy); });
  }
  return response;
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameSite = url.origin === self.location.origin;
  var fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameSite && !fonts) return;
  // Big downloads (the course description files) are left to the browser.
  if (sameSite && url.pathname.indexOf('/assets/files/tawsif/') === 0) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(function (res) { return saveCopy(req, res); })
        .catch(function () {
          return caches.match(req, { ignoreSearch: true })
            .then(function (hit) { return hit || caches.match(url.pathname.replace(/\/?$/, '/'), { ignoreSearch: true }); })
            .then(function (hit) { return hit || caches.match('/'); });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (hit) {
      var fresh = fetch(req).then(function (res) { return saveCopy(req, res); }).catch(function () { return hit; });
      return hit || fresh;
    })
  );
});
