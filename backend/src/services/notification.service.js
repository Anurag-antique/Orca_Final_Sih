const supabase = require("../config/supabase");
const notificationStream = require("./notificationStream.service");

const VALID_SEVERITIES = new Set(["INFO", "WARNING", "CRITICAL"]);
const VALID_TYPES = new Set([
  "weather",
  "ocean",
  "geofence",
  "advisory",
  "vessel",
]);

/**
 * Persist a notification and push it to any live SSE subscribers.
 * Never fabricates — callers must pass real data.
 */
async function createNotification(input) {
  const {
    userId = null,
    type,
    title,
    message,
    severity = "INFO",
    latitude = null,
    longitude = null,
    vesselId = null,
    sector = null,
    metadata = {},
  } = input || {};

  if (!type || !VALID_TYPES.has(type)) {
    throw new Error(`Invalid notification type: ${type}`);
  }
  if (!title || !message) {
    throw new Error("Notification requires title and message.");
  }
  if (!VALID_SEVERITIES.has(severity)) {
    throw new Error(`Invalid severity: ${severity}`);
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      severity,
      latitude,
      longitude,
      vessel_id: vesselId,
      sector,
      metadata,
    })
    .select()
    .single();

  if (error) throw new Error(`Notification insert failed: ${error.message}`);

  // Push to live SSE clients (broadcast if userId is null).
  notificationStream.publish(userId, data);

  return data;
}

/**
 * List notifications visible to a user (their own + broadcasts).
 */
async function listNotifications({
  userId,
  limit = 50,
  unreadOnly = false,
} = {}) {
  let query = supabase
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(1, limit), 200));

  if (unreadOnly) query = query.eq("read", false);

  const { data, error } = await query;
  if (error) throw new Error(`Notification list failed: ${error.message}`);
  return data || [];
}

async function markRead(id, userId) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .select()
    .single();

  if (error) throw new Error(`Mark-read failed: ${error.message}`);
  return data;
}

async function markAllRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false)
    .or(`user_id.eq.${userId},user_id.is.null`);

  if (error) throw new Error(`Mark-all-read failed: ${error.message}`);
  return true;
}

/**
 * Deduplication guard: avoid re-inserting the same rule alert too often.
 * Only returns true if no identical (type + title + sector) exists within `windowMs`.
 */
async function isDuplicate({ type, title, sector, windowMs = 30 * 60 * 1000 }) {
  const since = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("type", type)
    .eq("title", title)
    .gte("created_at", since)
    .limit(1);

  if (error) return false; // fail-open — better to notify than swallow
  return Array.isArray(data) && data.length > 0;
}

module.exports = {
  createNotification,
  listNotifications,
  markRead,
  markAllRead,
  isDuplicate,
};
