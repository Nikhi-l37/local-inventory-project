# Local Inventory Server

Backend API for the Local Inventory Project, now configured for Supabase.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in this directory with your Supabase credentials:

```env
DATABASE_USER=postgres
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_NAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_PORT=5432
JWT_SECRET=your_jwt_secret_here
```

See `.env.example` for a template.

### 3. Enable Supabase Extensions

In your Supabase Dashboard:
1. Go to **Database** > **Extensions**
2. Enable these extensions:
   - ✅ **postgis** (for geolocation features)
   - ✅ **pg_trgm** (for fuzzy search)

### 4. Run Database Migrations

```bash
# Create categories table and add category_id column
npm run migrate:v3

# Create search optimization indexes
npm run migrate:search
```

### 5. Test Database Connection

```bash
npm run troubleshoot
```

This will verify:
- Environment variables are set correctly
- Database connection works
- Required extensions are enabled
- Required tables exist

### 6. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3001`

## Available Scripts

- `npm start` - Start the server with nodemon (auto-restart on changes)
- `npm run troubleshoot` - Run connection diagnostics
- `npm run migrate:v3` - Run V3 migration (categories)
- `npm run migrate:search` - Run search optimization migration

## API Endpoints

### Health Check
- `GET /api/health` - Check server and database status

### Authentication
- `POST /api/sellers/register` - Register new seller
- `POST /api/sellers/login` - Login seller
- `POST /api/sellers/forgot-password` - Request password reset
- `POST /api/sellers/reset-password/:token` - Reset password

### Shops
- `POST /api/shops` - Create shop (requires auth)
- `GET /api/shops/my-shop` - Get current seller's shop (requires auth)
- `PATCH /api/shops/status` - Update shop open/closed status (requires auth)
- `PATCH /api/shops/update-details` - Update shop details (requires auth)
- `PATCH /api/shops/update-location` - Update shop location (requires auth)
- `GET /api/shops/my-shop/products` - Get all products for shop (requires auth)

### Products
- `POST /api/products` - Create product (requires auth)
- `PATCH /api/products/:productId` - Update product availability (requires auth)
- `PATCH /api/products/:productId/details` - Update product details (requires auth)
- `DELETE /api/products/:productId` - Delete product (requires auth)
- `GET /api/products/shop/:shopId` - Get all products for a shop (public)

### Categories
- `POST /api/categories` - Create category (requires auth)
- `GET /api/categories/shop/:shopId` - Get categories for a shop
- `PATCH /api/categories/:categoryId` - Update category (requires auth)
- `DELETE /api/categories/:categoryId` - Delete category (requires auth)

### Search
- `GET /api/search?q=query&lat=17.385&lon=78.486&open_only=true` - Search products
- `GET /api/search/shops?q=query&lat=17.385&lon=78.486&open_only=true` - Search shops

## Common Issues

### Connection Issues

**Symptom**: Cannot connect to database

**Solutions**:
1. Run `npm run troubleshoot` to diagnose
2. Check if Supabase project is active (not paused)
3. Verify credentials in `.env` file
4. Try switching between port 5432 (direct) and 6543 (pooler)
5. Check your internet connection

### Too Many Connections

**Symptom**: "sorry, too many clients already"

**Solutions**:
1. Use Supabase pooler (port 6543)
2. Reduce connection pool size in `db.js`
3. Ensure connections are being released properly

### PostGIS Functions Not Found

**Symptom**: "function st_geomfromtext does not exist"

**Solution**: Enable PostGIS extension in Supabase Dashboard

### Search Not Working

**Symptom**: Search returns no results or errors

**Solutions**:
1. Enable pg_trgm extension in Supabase Dashboard
2. Run `npm run migrate:search` to create search indexes
3. Verify latitude/longitude are being sent correctly

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_USER | Database username | postgres |
| DATABASE_HOST | Supabase host | db.xxxxx.supabase.co |
| DATABASE_NAME | Database name | postgres |
| DATABASE_PASSWORD | Database password | your_password |
| DATABASE_PORT | Port (5432 or 6543) | 5432 |
| JWT_SECRET | JWT signing secret | random_string_here |

## Database Connection Modes

### Direct Connection (Port 5432)
- Best for: Development, migrations, long queries
- Pros: Full PostgreSQL features, no restrictions
- Cons: Limited concurrent connections

### Pooler Mode (Port 6543)
- Best for: Production, high traffic, serverless
- Pros: Better connection management, higher concurrency
- Cons: Some PostgreSQL features may be limited

## Troubleshooting

1. **Check Environment Variables**: Ensure all required variables are set
2. **Test Connection**: Run `npm run troubleshoot`
3. **Check Extensions**: Verify PostGIS and pg_trgm are enabled
4. **Run Migrations**: Ensure all tables and indexes exist
5. **Check Logs**: Look for detailed error messages in console

For more detailed migration instructions, see [SUPABASE_MIGRATION.md](../SUPABASE_MIGRATION.md)

## Support

For issues:
1. Check the troubleshooting guide above
2. Run `npm run troubleshoot` for diagnostics
3. Check Supabase project dashboard for status
4. Review server logs for detailed errors
