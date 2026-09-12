const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const config = require("../config");

if (!config.databaseUrl) {
  console.error("[Migration] Missing DATABASE_URL in environment.");
  process.exit(1);
}

async function runMigrations() {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ---------------------------------------------------------------
    // users
    // ---------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'fisherman',
        organization TEXT DEFAULT '',
        vessel_name TEXT DEFAULT '',
        preferred_sector TEXT DEFAULT 'Arabian Sea / Mumbai Coast',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE 'plpgsql';
    `);

    await client.query(`DROP TRIGGER IF EXISTS trg_users_updated_at ON users;`);
    await client.query(`
      CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);
    await client.query(`DROP POLICY IF EXISTS "no_public_access" ON users;`);
    await client.query(`
      CREATE POLICY "no_public_access" ON users FOR ALL USING (false);
    `);

    // ---------------------------------------------------------------
    // notifications
    // ---------------------------------------------------------------
    // Step 1 — create with the current schema if it does not exist.
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'INFO',
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        vessel_id TEXT,
        sector TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Step 2 — evolve an existing table (older experiments may lack columns).
    // Every statement is idempotent.
    await client.query(`
      ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS type TEXT,
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS message TEXT,
        ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'INFO',
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS vessel_id TEXT,
        ADD COLUMN IF NOT EXISTS sector TEXT,
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // Step 3 — backfill NULLs from legacy rows so NOT NULL / defaults apply.
    await client.query(`
      UPDATE notifications
      SET
        severity = COALESCE(severity, 'INFO'),
        metadata = COALESCE(metadata, '{}'::jsonb),
        read = COALESCE(read, FALSE),
        created_at = COALESCE(created_at, NOW())
      WHERE
        severity IS NULL
        OR metadata IS NULL
        OR read IS NULL
        OR created_at IS NULL;
    `);

    // Step 4 — enforce NOT NULL only if the column has no NULLs left.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications'
            AND column_name = 'type'
            AND is_nullable = 'NO'
        ) THEN
          BEGIN
            ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'Skipping NOT NULL on type — legacy NULL rows remain.';
          END;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications'
            AND column_name = 'title'
            AND is_nullable = 'NO'
        ) THEN
          BEGIN
            ALTER TABLE notifications ALTER COLUMN title SET NOT NULL;
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'Skipping NOT NULL on title — legacy NULL rows remain.';
          END;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications'
            AND column_name = 'message'
            AND is_nullable = 'NO'
        ) THEN
          BEGIN
            ALTER TABLE notifications ALTER COLUMN message SET NOT NULL;
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'Skipping NOT NULL on message — legacy NULL rows remain.';
          END;
        END IF;
      END $$;
    `);

    // Step 5 — indexes (safe now that the columns exist).
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created
      ON notifications (user_id, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_unread
      ON notifications (user_id, read) WHERE read = FALSE;
    `);

    // Step 6 — RLS (existing behaviour).
    await client.query(`ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`);
    await client.query(
      `DROP POLICY IF EXISTS "no_public_access" ON notifications;`,
    );
    await client.query(`
      CREATE POLICY "no_public_access" ON notifications FOR ALL USING (false);
    `);

    await client.query("COMMIT");
    console.log(
      "[Migration] ✅ users + notifications tables, triggers, and RLS ready.",
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[Migration] ❌ Failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedDemoUser() {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const email = "demo@orca.marine";
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email],
    );

    if (existing.rows.length > 0) {
      console.log("[Seed] Demo user already exists — skipping.");
      return;
    }

    const passwordHash = bcrypt.hashSync("Password123!", 10);

    await pool.query(
      `INSERT INTO users
        (name, email, password_hash, role, organization, vessel_name, preferred_sector)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        "Captain Rajesh Kumar",
        email,
        passwordHash,
        "fisherman",
        "Western Coastal Fisheries Co-op",
        "Matsya Sagar IV (IND-MH-02-1984)",
        "Arabian Sea / Mumbai Coast",
      ],
    );

    console.log(
      "[Seed] ✅ Demo user created (demo@orca.marine / Password123!).",
    );
  } catch (err) {
    console.error("[Seed] ❌ Failed:", err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

module.exports = { runMigrations, seedDemoUser };
