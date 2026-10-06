/* 考研英语笔记复习 · Service Worker：离线可用 */
const CACHE = "kaoyan-v2-2012-2015";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  /* 页面导航：网络优先，离线才用缓存 —— 保证云端更新立即生效 */
  const isNav = e.request.mode === "navigate" || e.request.destination === "document" ||
                url.pathname.endsWith("index.html") || url.pathname === "/" ;
  if (isNav) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return r;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  /* 静态资源：缓存优先，后台静默更新 */
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
