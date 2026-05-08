// /// Service Worker — Obelisk PWA
// const CACHE_NAME = "obelisk-cache-v1";
// const PUBLIC_NAVIGATION_PATHS = ["/", "/login"];

// function isPublicNavigationPath(pathname) {
//     return PUBLIC_NAVIGATION_PATHS.some(
//         (candidate) =>
//             pathname === candidate || pathname.startsWith(`${candidate}/`),
//     );
// }

// // Cache the app shell on install
// self.addEventListener("install", (event) => {
//     event.waitUntil(
//         caches.open(CACHE_NAME).then((cache) => cache.addAll(["/"])),
//     );
//     self.skipWaiting();
// });

// // Clean old caches on activate
// self.addEventListener("activate", (event) => {
//     event.waitUntil(
//         caches
//             .keys()
//             .then((keys) =>
//                 Promise.all(
//                     keys
//                         .filter((key) => key !== CACHE_NAME)
//                         .map((key) => caches.delete(key)),
//                 ),
//             ),
//     );
//     self.clients.claim();
// });

// // Network-first strategy for navigations, cache-first for static assets
// self.addEventListener("fetch", (event) => {
//     const { request } = event;
//     const url = new URL(request.url);

//     // Skip non-GET and API/auth requests
//     if (request.method !== "GET") return;
//     if (url.pathname.startsWith("/api/") || request.url.includes("/v1/"))
//         return;

//     // Navigation requests — never cache authenticated dashboard content.
//     if (request.mode === "navigate") {
//         if (!isPublicNavigationPath(url.pathname)) {
//             event.respondWith(fetch(request));
//             return;
//         }

//         event.respondWith(
//             fetch(request)
//                 .then((response) => {
//                     const clone = response.clone();
//                     caches
//                         .open(CACHE_NAME)
//                         .then((cache) => cache.put(request, clone));
//                     return response;
//                 })
//                 .catch(() =>
//                     caches.match(request).then((r) => r || caches.match("/")),
//                 ),
//         );
//         return;
//     }

//     // Static assets — cache first, fallback to network
//     if (
//         request.destination === "style" ||
//         request.destination === "script" ||
//         request.destination === "image" ||
//         request.destination === "font"
//     ) {
//         event.respondWith(
//             caches.match(request).then(
//                 (cached) =>
//                     cached ||
//                     fetch(request).then((response) => {
//                         const clone = response.clone();
//                         caches
//                             .open(CACHE_NAME)
//                             .then((cache) => cache.put(request, clone));
//                         return response;
//                     }),
//             ),
//         );
//     }
// });
