# Common Issues After Migration - Solutions

This document addresses common issues that occur after migrating from pgAdmin to Supabase.

## Issue 1: Product Search Not Working

### Symptoms
- Search returns no results
- Error: "function similarity does not exist"
- Search endpoint returns 500 error

### Root Cause
The `pg_trgm` extension is not enabled in Supabase.

### Solution
1. Go to Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for `pg_trgm`
4. Click **Enable**
5. Wait 10-15 seconds for activation
6. Restart your server

### Verification
```bash
cd server
npm run troubleshoot
```
Look for: `✓ pg_trgm is available`

---

## Issue 2: Creating New User Fails

### Symptoms
- Registration endpoint returns 500 error
- Error: "relation 'sellers' does not exist"
- Can't create new seller accounts

### Root Cause
Database schema (tables) not created in Supabase.

### Solution
Create the database schema using the SQL file:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `server/schema.sql`
3. Paste into SQL Editor
4. Click **Run**

Or use migration scripts:
```bash
cd server
npm run migrate:v3
npm run migrate:search
```

### Verification
```bash
cd server
npm run troubleshoot
```
Should show all required tables exist.

---

## Issue 3: Sign Into Dashboard Fails

### Symptoms
- Login returns "Token is not valid"
- JWT verification fails
- Authentication doesn't work

### Root Cause
`JWT_SECRET` not set or different between environments.

### Solution
1. Check your `server/.env` file
2. Ensure `JWT_SECRET` is set to a secure random string
3. Generate a new secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Update `.env` with the new secret
5. Restart server

**Important**: All users will need to login again after changing JWT_SECRET.

### Verification
Try registering and logging in with a test account.

---

## Issue 4: Creating Products Fails

### Symptoms
- POST /api/products returns 500 error
- Error: "function st_geomfromtext does not exist"
- Error: "column 'category_id' does not exist"

### Root Cause A: PostGIS Extension Not Enabled

### Solution
1. Go to Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for `postgis`
4. Click **Enable**
5. Wait for activation
6. Restart server

### Root Cause B: Schema Not Migrated

### Solution
Run migrations:
```bash
cd server
npm run migrate:v3
npm run migrate:search
```

### Verification
```bash
cd server
npm run troubleshoot
```
Look for: `✓ PostGIS is available`

---

## Issue 5: Connection Timeout / Too Many Connections

### Symptoms
- "Connection timeout" errors
- "sorry, too many clients already"
- "remaining connection slots are reserved"
- Intermittent 503 errors

### Root Cause
Supabase connection pooling issues. Free tier has limited connections.

### Solution 1: Use Pooler Mode
Edit `server/.env`:
```env
DATABASE_PORT=6543  # Changed from 5432
```

### Solution 2: Reduce Pool Size
Already configured in `db.js` (max: 10 connections)

### Solution 3: Check for Connection Leaks
Ensure all database queries are properly awaited and connections are released.

### Verification
Monitor connections in Supabase Dashboard → Database → Connection Pooling

---

## Issue 6: Slow Query Performance

### Symptoms
- Search takes several seconds
- Product listings are slow
- Shop queries timeout

### Root Cause
Missing indexes for search optimization.

### Solution
Run search migration:
```bash
cd server
npm run migrate:search
```

This creates GIN indexes for fuzzy text search.

### Verification
Queries should complete in < 1 second.

---

## Issue 7: "Cannot Connect to Database"

### Symptoms
- Server won't start
- "ENOTFOUND" or "ECONNREFUSED" errors
- Connection completely fails

### Solutions

1. **Check Supabase Project Status**
   - Free tier projects pause after 7 days of inactivity
   - Go to Supabase Dashboard and check if project is paused
   - Click "Resume Project" if needed

2. **Verify Credentials**
   ```bash
   cd server
   npm run troubleshoot
   ```
   This will check all credentials.

3. **Check Network**
   - Ensure you have internet connection
   - Try accessing Supabase Dashboard
   - Check if firewall is blocking Supabase

4. **Try Different Port**
   - Switch between 5432 (direct) and 6543 (pooler)
   - Edit `DATABASE_PORT` in `.env`

---

## Issue 8: Images Not Showing

### Symptoms
- Product/shop images return 404
- Image URLs are broken
- Uploads directory empty

### Root Cause
Images were stored locally and not migrated to Supabase.

### Solution
This application stores images locally in `server/uploads/` directory.

**Option A**: Continue using local storage (current setup)
- Ensure `server/uploads/` directory exists
- Images persist between restarts

**Option B**: Migrate to Supabase Storage
1. Go to Supabase Dashboard → Storage
2. Create a bucket named "shop-images"
3. Update image upload logic to use Supabase Storage API
4. Update image URLs to point to Supabase CDN

---

## Issue 9: Location-Based Features Not Working

### Symptoms
- Distance calculations fail
- Location queries return errors
- Error: "type geography does not exist"

### Root Cause
PostGIS extension not enabled.

### Solution
Same as Issue 4 - enable PostGIS extension.

---

## Issue 10: Environment Variables Not Loading

### Symptoms
- "DATABASE_HOST is undefined"
- Connection uses default values
- `.env` file seems ignored

### Solution
1. Ensure `.env` file is in `server/` directory (not root)
2. Check file is named exactly `.env` (not `.env.txt`)
3. Verify no spaces around `=` in `.env`:
   ```env
   DATABASE_HOST=db.xxxxx.supabase.co  # ✓ Correct
   DATABASE_HOST = db.xxxxx.supabase.co  # ✗ Wrong
   ```
4. Restart server completely (Ctrl+C and `npm start` again)

---

## Still Having Issues?

### Run Full Diagnostics
```bash
cd server
npm run setup        # Check configuration
npm run troubleshoot # Test everything
```

### Check Logs
Server logs will show detailed error messages. Look for:
- Database connection errors
- Extension availability
- Query failures
- Authentication issues

### Check Supabase Dashboard
- Go to Logs → Database
- Check for errors or warnings
- Monitor query performance

### Get Help
1. Review [SUPABASE_MIGRATION.md](SUPABASE_MIGRATION.md)
2. Check [server/README.md](server/README.md)
3. Verify all checklist items in [QUICK_START.md](QUICK_START.md)

---

## Prevention Tips

1. **Always run migrations** after setting up new database
2. **Enable all required extensions** (PostGIS, pg_trgm)
3. **Use troubleshoot script** before starting development
4. **Keep `.env` file secure** and never commit it
5. **Monitor Supabase project** to prevent auto-pause
6. **Use pooler mode (port 6543)** in production

---

**Remember**: Most issues are solved by:
1. Enabling required extensions (PostGIS, pg_trgm)
2. Running migrations (npm run migrate:v3 && npm run migrate:search)
3. Checking credentials in .env file
4. Ensuring Supabase project is active
