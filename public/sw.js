// Painel MNZ — Service Worker mínimo
// Estratégia: network-first para navegação (sempre dados frescos),
// cache-first apenas para assets estáticos do Next.js e fontes.

const STATIC_CACHE = "painelmnz-static-v1";
const ASSET_URL_PATTERNS = [
  /^\/_next\/static\//,
  /\.(?:woff2?|ttf|otf|eot)$/,
  /\/icon(\?|$)/,
  /\/apple-icon(\?|$)/,
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Apenas GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Nunca cachear APIs, rotas do dashboard ou auth (dados sensíveis)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/portal/")
  ) {
    return;
  }

  // Cache-first para assets estáticos
  const isAsset = ASSET_URL_PATTERNS.some((p) => p.test(url.pathname));
  if (!isAsset) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    }),
  );
});
