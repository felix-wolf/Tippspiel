self.addEventListener("install", (event) => {
  console.log("Service worker installing...");
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
});

self.addEventListener("fetch", (event) => {
  console.log("Fetching:", event.request.url);
  // Optionally handle requests
});

self.addEventListener("push", (event) => {
  console.log("[Service Worker]: Received push event", event);
});
