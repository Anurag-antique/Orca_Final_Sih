// Static map of route -> offline availability.
// 'live'   -> renders offline from app shell, no data fetch required
// 'cached' -> works offline if the page's GET data was cached
// 'online' -> requires live connection (POST or private data)
export const ROUTE_AVAILABILITY = {
  '/':          'live',
  '/dashboard': 'cached',
  '/map':       'cached',
  '/routes':    'online',   // plan route POST is online-only
  '/alerts':    'cached',
  '/pfz':       'cached',
  '/history':   'online',   // traces/export, potentially private
  '/chat':      'online',   // chat POST is online-only
  '/profile':   'online',   // /auth/me never cached
};