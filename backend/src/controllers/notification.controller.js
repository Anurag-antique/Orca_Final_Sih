const notificationService = require("../services/notification.service");
const notificationStream = require("../services/notificationStream.service");

/**
 * GET /api/notifications
 */
const list = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const unreadOnly = req.query.unread === "true";
    const limit = parseInt(req.query.limit, 10) || 50;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        notifications: [],
      });
    }

    const notifications = await notificationService.listNotifications({
      userId,
      limit,
      unreadOnly,
    });
    return res
      .status(200)
      .json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
const markRead = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });

    const row = await notificationService.markRead(req.params.id, userId);
    return res.status(200).json({ success: true, notification: row });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });

    await notificationService.markAllRead(userId);
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/notifications/stream   (SSE)
 */
const stream = (req, res) => {
  const userId = req.user?.id || null;
  if (!userId) return res.status(401).end();

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write(`event: hello\ndata: ${JSON.stringify({ userId })}\n\n`);

  notificationStream.subscribe(res, userId);
};

module.exports = { list, markRead, markAllRead, stream };
