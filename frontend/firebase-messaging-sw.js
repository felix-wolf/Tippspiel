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
    notificationData.notification.title,
    { 
      body: notificationData.notification.body,
      actions: [
        {action: "Test", title: "ActionTItle"}
      ]
    }
  );
  const promiseChain = Promise.all([
    messageClientPromise,
    showNotificationPromise,
  ]);

  event.waitUntil(promiseChain);
});

// Custom notification actions
self.addEventListener('notificationclick', (event) => {
  console.log(
    '[Service Worker]: Received notificationclick event',
    event.notification
  );

  try {
    let notification = event.notification;

    if (event.action == 'open_url') {
      console.log('[Service Worker]: Performing action open_url');

      event.waitUntil(clients.openWindow(notification.data.action.url));

      return;
    } else if (event.action == 'open_project_repo') {
      console.log('[Service Worker]: Performing action open_project_repo');

      event.waitUntil(clients.openWindow(notification.data.project.github));

      return;
    } else if (event.action == 'open_author_twitter') {
      console.log('[Service Worker]: Performing action open_author_twitter');

      event.waitUntil(clients.openWindow(notification.data.author.twitter));

      return;
    }
  } catch (error) {
    console.error('[Service Worker]: Error parsing notification data', error);
  }

  console.log('[Service Worker]: Performing default click action');

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        includeUncontrolled: true,
        type: 'window',
      })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url == '/' && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
  );

  event.notification.close();
});

// Closing notification action
self.addEventListener('notificationclose', (event) => {
  console.log(
    '[Service Worker]: Received notificationclose event',
    event.notification
  );
});