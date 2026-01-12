# 🚀 Quick Migration Checklist

Use this checklist to migrate from pgAdmin to Supabase quickly.

## Pre-Migration

- [ ] Have a Supabase account (free tier is fine)
- [ ] Node.js v16+ installed
- [ ] Current project backed up

## Supabase Setup (5-10 minutes)

### 1. Create Supabase Project
- [ ] Go to https://supabase.com/dashboard
- [ ] Create a new project or select existing
- [ ] Note down your project URL and password

### 2. Enable Extensions
- [ ] Navigate to Database → Extensions
- [ ] Enable **postgis**
- [ ] Enable **pg_trgm**

### 3. Create Database Schema
- [ ] Go to SQL Editor in Supabase
- [ ] Open `server/schema.sql` from this repo
- [ ] Copy and paste entire content into SQL Editor
- [ ] Click "Run" to execute
- [ ] Verify success (should see green checkmarks)

## Application Setup (5 minutes)

### 4. Get Connection Details
- [ ] Go to Settings → Database in Supabase
- [ ] Copy your connection string
- [ ] Parse it to get: host, password

### 5. Configure Server
```bash
cd server
cp .env.example .env
# Edit .env with your Supabase credentials
```

- [ ] Set `DATABASE_HOST` to your Supabase host (e.g., db.xxxxx.supabase.co)
- [ ] Set `DATABASE_PASSWORD` to your database password
- [ ] Generate and set `JWT_SECRET` using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 6. Install Dependencies
```bash
cd server
npm install

cd ../client
npm install
```

### 7. Verify Setup
```bash
cd server
npm run setup        # Check configuration
npm run troubleshoot # Test database connection
```

## Start Application (2 minutes)

### 8. Start Backend
```bash
cd server
npm start
```
- [ ] Server should start without errors
- [ ] Look for "✓ Database connected successfully" message

### 9. Start Frontend
```bash
cd client
npm run dev
```
- [ ] Opens at http://localhost:5173

## Test Everything (5 minutes)

### 10. Test Features
- [ ] Register a new user
- [ ] Login with the new user
- [ ] Create a shop
- [ ] Add a product
- [ ] Search for the product
- [ ] Update product details
- [ ] Toggle product availability

## Troubleshooting

### If connection fails:
```bash
cd server
npm run troubleshoot
```

### Common fixes:
1. **Wrong credentials** → Double-check .env file
2. **Extensions not enabled** → Enable PostGIS and pg_trgm in Supabase
3. **Project paused** → Unpause in Supabase dashboard (free tier pauses after inactivity)
4. **Port issues** → Try port 6543 instead of 5432 (pooler mode)

### Still having issues?
- Check [SUPABASE_MIGRATION.md](SUPABASE_MIGRATION.md) for detailed guide
- Check [server/README.md](server/README.md) for API documentation
- Run `npm run troubleshoot` for diagnostics

## Success! ✅

If all tests pass, your migration is complete!

### What Changed?
- ✅ Database: pgAdmin → Supabase
- ✅ Connection: Local PostgreSQL → Cloud Supabase
- ✅ SSL: Added SSL support
- ✅ Pooling: Optimized for Supabase
- ✅ Error Handling: Enhanced with retry logic
- ✅ Health Checks: Added monitoring endpoint

### What Stayed the Same?
- Same API endpoints
- Same authentication flow
- Same features
- Same frontend code

### Next Steps
- Set up automatic backups in Supabase
- Configure Row Level Security (RLS) for additional security
- Monitor usage in Supabase dashboard
- Consider upgrading to Pro tier if you exceed free tier limits

---

**Estimated Total Time**: 15-20 minutes
**Difficulty**: Easy (just follow the steps!)
