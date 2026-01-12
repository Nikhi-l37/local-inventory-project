# Supabase Migration Guide

This guide will help you migrate from pgAdmin (local PostgreSQL) to Supabase.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com if you don't have one)
2. Your database credentials from Supabase

## Step 1: Get Your Supabase Connection Details

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Database**
3. Scroll down to **Connection string** section
4. You'll see a connection string like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
5. Note down these details:
   - Host: `db.xxxxx.supabase.co`
   - Password: Your database password
   - Port: `5432` (direct connection) or `6543` (pooler mode)

## Step 2: Enable Required Extensions

Your application uses PostGIS for geospatial features and pg_trgm for fuzzy search.

1. In your Supabase dashboard, go to **Database** > **Extensions**
2. Search for and enable these extensions:
   - ✅ **postgis** (for location-based features)
   - ✅ **pg_trgm** (for fuzzy text search)

## Step 3: Configure Environment Variables

1. Update the `/server/.env` file with your Supabase credentials:

```env
DATABASE_USER=postgres
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_NAME=postgres
DATABASE_PASSWORD=your_password_here
DATABASE_PORT=5432
JWT_SECRET=your_jwt_secret_here
```

**Important Notes:**
- Use port `5432` for direct connection (recommended for most use cases)
- Use port `6543` for Supabase Transaction Pooler (for serverless or high-traffic apps)
- Never commit the `.env` file to version control (it's already in `.gitignore`)

## Step 4: Create Database Schema

Run the migration scripts to create the necessary tables:

```bash
cd server
# Run the V3 migration (creates categories table and adds category_id column)
node scripts/migrate_v3.js

# Run the search optimization migration (adds indexes for fuzzy search)
node scripts/migrate_search.js
```

If you need to create the base schema (sellers, shops, products tables), you may need to create them manually in Supabase SQL Editor or run appropriate migrations.

### Base Schema (if needed)

Execute this in Supabase SQL Editor if tables don't exist:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Sellers table
CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shops table with geospatial support
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    location GEOGRAPHY(POINT, 4326),
    town_village VARCHAR(255),
    mandal VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    description TEXT,
    opening_time TIME,
    closing_time TIME,
    image_url VARCHAR(255),
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    category_id INTEGER,
    price NUMERIC(10, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shops_seller_id ON shops(seller_id);
```

## Step 5: Test the Connection

Start your server and test the connection:

```bash
cd server
npm start
```

If you see "Server is running successfully" without database errors, the connection is working!

## Step 6: Test API Endpoints

Test these critical endpoints to ensure everything works:

1. **User Registration**: POST `/api/sellers/register`
2. **User Login**: POST `/api/sellers/login`
3. **Create Shop**: POST `/api/shops` (requires authentication)
4. **Create Product**: POST `/api/products` (requires authentication)
5. **Search Products**: GET `/api/search?q=query&lat=17.385&lon=78.486`

## Common Issues and Solutions

### Issue 1: Connection Timeout

**Error**: `Connection timeout` or `ETIMEDOUT`

**Solution**: 
- Make sure you're using the correct port (5432 or 6543)
- Try switching to pooler mode (port 6543) if direct connection fails
- Check your Supabase project is not paused (free tier pauses after inactivity)

### Issue 2: SSL Certificate Error

**Error**: `self signed certificate` or SSL-related errors

**Solution**: The code already handles this with `ssl: { rejectUnauthorized: false }`

### Issue 3: Too Many Connections

**Error**: `sorry, too many clients already` or `remaining connection slots`

**Solution**: 
- Use Supabase Transaction Pooler (port 6543)
- Reduce `max` connections in `db.js` (currently set to 10 for Supabase)
- Ensure connections are properly closed after use

### Issue 4: Query Timeout

**Error**: Query takes too long or times out

**Solution**: 
- Check your network connection
- Ensure PostGIS and pg_trgm extensions are enabled
- Verify indexes are created (run `migrate_search.js`)

### Issue 5: PostGIS Functions Not Found

**Error**: `function st_geomfromtext does not exist`

**Solution**: Enable PostGIS extension in Supabase (Database > Extensions)

## Connection Pooling

The application is configured with optimal connection pooling settings for Supabase:

- **Max connections**: 10 (Supabase free tier limit)
- **Idle timeout**: 20 seconds
- **Connection timeout**: 10 seconds
- **Auto-exit on idle**: Enabled

These settings prevent connection exhaustion and ensure efficient resource usage.

## Security Considerations

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong JWT secret** - Generate one using:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Use Supabase Row Level Security (RLS)** - Optional but recommended for additional security
4. **Rotate credentials regularly** - Change passwords periodically

## Need Help?

If you encounter issues:
1. Check Supabase project is active (not paused)
2. Verify all extensions are enabled
3. Check server logs for detailed error messages
4. Ensure your IP is not blocked by Supabase (check project settings)

## Migration Complete! 🎉

Once everything is working, you can remove any old pgAdmin configurations and enjoy the benefits of Supabase:
- Automatic backups
- Built-in API
- Real-time subscriptions (if needed later)
- Better scalability
