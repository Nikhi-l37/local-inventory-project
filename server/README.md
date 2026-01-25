# Local Inventory Server

Backend API for the Local Inventory Project, now configured for Supabase with OTP-based login.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages including `nodemailer` and `express-rate-limit` for OTP functionality.

### 2. Configure Environment Variables

Create a `.env` file in this directory:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database (Supabase)
DATABASE_USER=postgres
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_NAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_PORT=5432

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# SMTP (required for OTP emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
MAIL_FROM=noreply@localinventory.com

# OTP Config (optional - uses sensible defaults)
OTP_EXPIRY_SECONDS=300
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=30
OTP_MAX_RESENDS=3
```

See `.env.example` for complete documentation.

### 3. Enable Supabase Extensions

In your Supabase Dashboard:
1. Go to **Database** > **Extensions**
2. Enable these extensions:
   - ✅ **postgis** (for geolocation features)
   - ✅ **pg_trgm** (for fuzzy search)

### 4. Create OTP Table

In your Supabase Dashboard:
1. Go to **SQL Editor**
2. Create new query
3. Copy content from: `supabase/migrations/20250125000001_create_seller_login_otp.sql`
4. Click **Run**

### 5. Run Database Migrations (Optional)

```bash
# Create categories table and add category_id column
npm run migrate:v3

# Create search optimization indexes
npm run migrate:search
```

### 6. Test Database Connection

```bash
npm run setup        # Check configuration
npm run troubleshoot # Test database connection
```

### 7. Start the Server

```bash
npm run dev
```

Expected startup output:

```
[OTP] Configuration loaded:
  - Expiry: 300s (5m)
  - Max attempts: 5
  - Resend cooldown: 30s
  - Max resends: 3
[MAIL] ✅ SMTP configuration verified successfully
Server is running successfully on http://localhost:3001
```

---

## SMTP Configuration

### Gmail (Recommended for Testing)

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   MAIL_FROM=noreply@localinventory.com
   ```

### Mailtrap (Best for Testing)

1. Create account: https://mailtrap.io
2. Copy SMTP credentials from your inbox
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_username
   SMTP_PASS=your_password
   MAIL_FROM=test@example.com
   ```
4. Check email logs in Mailtrap dashboard

---

## Testing the OTP Flow

### Test 1: Register New Seller

```bash
curl -X POST http://localhost:3001/api/sellers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### Test 2: Login (Get OTP Challenge)

```bash
curl -X POST http://localhost:3001/api/sellers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

Response:
```json
{
  "otpRequired": true,
  "challengeId": 42,
  "expiresIn": 300
}
```

Check your email (or Mailtrap) for the OTP code.

### Test 3: Verify OTP (Complete Login)

```bash
curl -X POST http://localhost:3001/api/sellers/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": 42,
    "otp": "123456"
  }'
```

Response (on success):
```json
{
  "token": "eyJhbGc...",
  "seller": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

### Test 4: Resend OTP

```bash
curl -X POST http://localhost:3001/api/sellers/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": 42
  }'
```

---

## Troubleshooting

### SMTP Not Working

**Check logs for**:
```
[MAIL] ❌ SMTP configuration error
```

**Solutions**:
1. Verify all `SMTP_*` variables in `.env`
2. For Gmail: Use app-specific password (not your main password)
3. Try Mailtrap.io for easier debugging
4. Check firewall: ensure port 587/465 is open

### Missing Environment Variables

**Error**: "Missing SMTP configuration variables"

**Solution**: Add all variables to `.env`:
```env
SMTP_HOST=...
SMTP_PORT=...
SMTP_SECURE=...
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=...
```

### Database Connection Failed

**Check logs for**:
```
Unexpected database error on idle client
```

**Solutions**:
1. Verify `DATABASE_*` variables in `.env`
2. Run: `npm run troubleshoot`
3. Check Supabase dashboard for connection issues
4. Ensure your IP is whitelisted in Supabase

### OTP Expired Immediately

**Cause**: System clock skew

**Solutions**:
1. Sync system clock
2. Check timezone matches Supabase (UTC)
3. Increase `OTP_EXPIRY_SECONDS` in `.env` for testing

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/sellers/register` | Create new seller |
| POST | `/api/sellers/login` | Step 1: Email + password → OTP |
| POST | `/api/sellers/verify-otp` | Step 2: Verify OTP → JWT |
| POST | `/api/sellers/resend-otp` | Resend OTP |
| POST | `/api/sellers/forgot-password` | Request password reset |
| POST | `/api/sellers/reset-password/:token` | Reset password |
| GET | `/api/health` | Server health check |

For full API documentation, see: `OTP_API_DOCUMENTATION.md`

---

## Configuration Reference

### Required Environment Variables

- `DATABASE_HOST` - Supabase host
- `DATABASE_USER` - Postgres user
- `DATABASE_NAME` - Database name
- `DATABASE_PASSWORD` - Database password
- `DATABASE_PORT` - Port (default: 5432)
- `JWT_SECRET` - JWT signing secret
- `SMTP_HOST` - SMTP server
- `SMTP_PORT` - SMTP port
- `SMTP_SECURE` - "true" or "false"
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `MAIL_FROM` - From email

### Optional OTP Configuration

- `OTP_EXPIRY_SECONDS` - Default: 300 (5 min)
- `OTP_MAX_ATTEMPTS` - Default: 5
- `OTP_RESEND_COOLDOWN_SECONDS` - Default: 30
- `OTP_MAX_RESENDS` - Default: 3

---

## Development Scripts

```bash
npm run dev           # Start with hot reload (nodemon)
npm start            # Start for production
npm run setup        # Check configuration
npm run troubleshoot # Test database connection
npm run migrate:v3   # Run v3 migrations
npm run migrate:search # Create search indexes
```

---

## File Structure

```
server/
├── auth.js                    # Authentication routes (OTP endpoints)
├── db.js                      # Database connection pool
├── index.js                   # Server entry point
├── utils/
│   ├── mail.js               # Nodemailer SMTP service
│   └── otp.js                # OTP generation & validation
├── middleware/
│   ├── auth.js              # Auth middleware
│   ├── errorHandler.js      # Error handling
│   ├── uploadMiddleware.js  # File upload
│   └── validation.js        # Input validation
├── .env                     # Local configuration (DO NOT COMMIT)
├── .env.example             # Configuration template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## For More Information

- **OTP Implementation Details**: See `OTP_IMPLEMENTATION.md`
- **API Reference**: See `OTP_API_DOCUMENTATION.md`
- **Main Project README**: See `../README.md`

---

**Last Updated**: 2025-01-25  
**Status**: Production Ready ✅


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
