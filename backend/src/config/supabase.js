const { createClient } = require("@supabase/supabase-js");
const config = require("./index");

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
  console.error(
    "[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

// Service-role client — server-side only. Never expose to browser.
const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

module.exports = supabase;
