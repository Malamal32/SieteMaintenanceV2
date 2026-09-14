const CACHE_NAME = "siete-document-portal-v5";
const APP_ROOT = "/SieteMaintenanceV2/";
const APP_SHELL = [
    APP_ROOT,
    `${APP_ROOT}index.html`,
    `${APP_ROOT}styles.css`,
    `${APP_ROOT}logo.png`,
    `${APP_ROOT}app-icon.svg`,
    `${APP_ROOT}assets/icons/app-icon-192.png`,
    `${APP_ROOT}assets/icons/app-icon-512.png`,
    `${APP_ROOT}assets/icons/apple-touch-icon.png`,
    `${APP_ROOT}offline.html`,
    `${APP_ROOT}pdf-viewer.html`
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok && url.origin === self.location.origin) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }

                    return response;
                })
                .catch(async () => {
                    return (await caches.match(request)) ||
                        (await caches.match(`${APP_ROOT}offline.html`));
                })
        );
        return;
    }

    if (
        url.origin === self.location.origin &&
        url.pathname.startsWith(APP_ROOT) &&
        !url.pathname.toLowerCase().endsWith(".pdf")
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                const network = fetch(request)
                    .then(response => {
                        if (response.ok) {
                            const copy = response.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                        }

                        return response;
                    })
                    .catch(() => cached);

                return cached || network;
            })
        );
    }
});
