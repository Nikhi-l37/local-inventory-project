# Quick Fix Guide: "Error creating shop"

If you're seeing "Error creating shop" when trying to create a shop after signing up, follow these simple steps:

## Step 1: Enable PostGIS Extension in Supabase

1. Go to your Supabase Dashboard
2. Click on **Database** → **Extensions**
3. Search for **postgis**
4. Click **Enable** (wait 10-15 seconds)

## Step 2: Run the Fix Script

Open your terminal and run:

```bash
cd server
npm run fix:location
```

This will automatically:
- Check your location column type
- Convert it to the correct format if needed
- Recreate indexes

## Step 3: Restart Your Server

```bash
npm start
```

## Step 4: Test Shop Creation

1. Go to your application
2. Sign up or log in
3. Fill in shop details
4. Click "Create Shop"
5. ✅ Should work now!

---

## Alternative: Manual Fix in Supabase

If the script doesn't work, you can fix it manually:

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste this SQL:

```sql
-- Check current type
SELECT column_name, udt_name, data_type
FROM information_schema.columns
WHERE table_name = 'shops' AND column_name = 'location';

-- If it shows 'geography', run this:
BEGIN;

ALTER TABLE shops ADD COLUMN location_temp GEOMETRY(POINT, 4326);
UPDATE shops SET location_temp = location::geometry WHERE location IS NOT NULL;
ALTER TABLE shops DROP COLUMN location;
ALTER TABLE shops RENAME COLUMN location_temp TO location;

DROP INDEX IF EXISTS idx_shops_location;
CREATE INDEX idx_shops_location ON shops USING GIST(location);

COMMIT;
```

3. Click **Run**
4. Restart your server

---

## Still Not Working?

Check these:

1. **Extensions Enabled?**
   - PostGIS should be enabled in Supabase

2. **Correct Credentials?**
   - Check your `server/.env` file has the right database details

3. **Server Logs**
   - Look at your terminal for error messages
   - They will tell you what's wrong

4. **Read More**
   - See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed help
   - See [FIX_SUMMARY.md](./FIX_SUMMARY.md) for technical details

---

## What This Fix Does

- Changes your location column from GEOGRAPHY type to GEOMETRY type
- Updates queries to use a better method (ST_MakePoint instead of ST_GeomFromText)
- Makes your app work with both old and new database setups

## Questions?

If you're still stuck, check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) file for more help!
