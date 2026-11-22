/* Service worker del CRM de Sky Studios Labs: muestra los avisos de clientes nuevos. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (e) {
    d = { titulo: "Sky Studios Labs", cuerpo: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(d.titulo || "Sky Studios Labs", {
      body: d.cuerpo || "Tienes un aviso nuevo.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: d.etiqueta || undefined,
      renotify: Boolean(d.etiqueta),
      data: { url: d.url || "/admin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/admin", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (v.url.startsWith(self.location.origin) && "focus" in v) {
          v.navigate(url);
          return v.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
