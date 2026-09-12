/**
 * Server-Sent Events (SSE) notification stream.
 *
 * One live HTTP stream per connected browser client, keyed by userId.
 * When `createNotification` runs, `publish(userId, payload)` pushes
 * the row to matching streams. Broadcast (userId null) → all streams.
 *
 * No dependencies, works behind the existing JWT middleware.
 */

const clients = new Set(); // { res, userId }

function subscribe(res, userId) {
  const client = { res, userId: userId || null };
  clients.add(client);

  // Keep-alive every 25 s to defeat proxy timeouts.
  const keepAlive = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      /* noop */
    }
  }, 25000);
  if (keepAlive.unref) keepAlive.unref();

  res.on("close", () => {
    clearInterval(keepAlive);
    clients.delete(client);
  });

  return () => {
    clearInterval(keepAlive);
    clients.delete(client);
  };
}

function publish(userId, notification) {
  const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  for (const client of clients) {
    // Broadcast (null userId) → everyone. Scoped → matching user only.
    if (userId == null || client.userId === userId || client.userId == null) {
      try {
        client.res.write(payload);
      } catch {
        // Client died mid-write; drop on next close event.
      }
    }
  }
}

function getStats() {
  return { connectedClients: clients.size };
}

module.exports = { subscribe, publish, getStats };
