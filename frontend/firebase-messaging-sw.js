async function messageClient(event, messageType, data = {}) {
  console.log('[Service Worker]: Sending message to app', messageType);

  let message = {
    type: messageType,
    data: data,
  };

  if (!event.clientId) {
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage(message);
      console.log('[Service Worker]: Sent message to app', client);
    }
  } else {
    const client = await clients.get(event.clientId);
    if (!client) return;

    client.postMessage(message);
    console.log('[Service Worker]: Sent message to app', client);
  }
}

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
 
  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('[Service Worker]: Error parsing notification data', error);
    notificationData = {
      title: 'No data from server',
      message: 'Displaying default notification',
      icon: 'https://push.foo/images/logo.jpg',
      badge: 'https://push.foo/images/logo-mask.png',
    };
  }

  console.log('[Service Worker]: notificationData', notificationData);

  const messageClientPromise = messageClient(
    event,
    'NOTIFICATION_RECEIVED',
    notificationData
  );

  const showNotificationPromise = self.registration.showNotification(
    notificationData.title,
    notificationData
  );
  const promiseChain = Promise.all([
    messageClientPromise,
    showNotificationPromise,
  ]);

  event.waitUntil(promiseChain);
});
