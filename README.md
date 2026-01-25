# Local Inventory Project

A location-based inventory management system for local shops, now powered by Supabase.

**New Feature**: Secure OTP-based login with email verification! 🔐

## 🚀 Quick Start (Supabase)

### Prerequisites
- Node.js v16 or higher
- A Supabase account (free tier works!)
- npm or yarn
- **SMTP credentials** (Gmail, Mailtrap, etc.) for OTP emails

### 1. Clone and Install

```bash
git clone <repository-url>
cd local-inventory-project

# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

### 2. Set Up Supabase Database

#### A. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **Database**
4. Find your connection string: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

#### B. Enable Required Extensions

In Supabase Dashboard:
1. Go to **Database** → **Extensions**
2. Enable these extensions:
   - ✅ **postgis** (for geolocation features)
   - ✅ **pg_trgm** (for fuzzy search)

#### C. Create Database Schema

Option 1: Using Supabase SQL Editor (Recommended)
1. Go to **SQL Editor** in Supabase Dashboard
2. Open `server/schema.sql`
3. Copy and paste the entire content
4. Click **Run** to execute

#### D. Create OTP Table (NEW)

1. In Supabase SQL Editor, create a new query
2. Copy the content from: `supabase/migrations/20250125000001_create_seller_login_otp.sql`
3. Paste and click **Run**

This creates the `seller_login_otp` table for the new OTP login feature.

Option 2: Using Migration Scripts (requires connection)
```bash
cd server
npm run migrate:v3
npm run migrate:search
```

### 3. Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `.env` with your Supabase and SMTP credentials:

```env
# Database
DATABASE_USER=postgres
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_NAME=postgres
DATABASE_PASSWORD=your_database_password
DATABASE_PORT=5432

# JWT
JWT_SECRET=generate_a_secure_random_string

# SMTP (for OTP email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
MAIL_FROM=noreply@localinventory.com
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### SMTP Configuration

The new OTP login feature requires SMTP credentials. Choose one:

**Option A: Gmail (Recommended for testing)**
1. Enable 2-Factor Authentication on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password as `SMTP_PASS`
4. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`

**Option B: Mailtrap (Best for testing)**
1. Create account: https://mailtrap.io
2. Copy SMTP credentials from Dashboard
3. Check "Email Logs" to verify OTP emails are sent

**Option C: Your own SMTP server**
Configure any SMTP server you have available.

See [OTP_IMPLEMENTATION.md](OTP_IMPLEMENTATION.md) for detailed SMTP setup instructions.

### 4. Verify Setup

```bash
cd server
npm run setup        # Check if everything is configured
npm run troubleshoot # Test database connection
```

### 5. Start the Application

```bash
# Terminal 1: Start the backend server
cd server
npm start
# Server runs on http://localhost:3001

# Terminal 2: Start the frontend
cd client
npm run dev
# Client runs on http://localhost:5173
```

Visit `http://localhost:5173` to use the application! 🎉

## 🔐 OTP Login Feature (NEW)

The project now uses **2-step OTP-based login** for enhanced security:

1. **Step 1**: Enter email + password
2. **Step 2**: Enter 6-digit code sent to email

**OTP Details**:
- Validity: 5 minutes
- Max verification attempts: 5
- Max resends: 3
- Resend cooldown: 30 seconds
- Rate limiting: Protects against brute force

For complete documentation, see [OTP_IMPLEMENTATION.md](OTP_IMPLEMENTATION.md).

## 📁 Project Structure

```
local-inventory-project/
├── server/              # Backend API (Express + PostgreSQL)
│   ├── db.js           # Database connection configuration
│   ├── index.js        # Main server file
│   ├── auth.js         # Authentication routes
│   ├── shop.js         # Shop management routes
│   ├── product.js      # Product management routes
│   ├── search.js       # Search functionality
│   ├── middleware/     # Custom middleware
│   ├── scripts/        # Migration scripts
│   └── .env           # Environment configuration (create this)
├── client/             # Frontend (React + Vite)
│   └── src/
└── SUPABASE_MIGRATION.md  # Detailed migration guide
```

## 🔧 Available Scripts

### Server (`cd server`)
- `npm start` - Start server with auto-reload
- `npm run setup` - Verify setup configuration
- `npm run troubleshoot` - Diagnose connection issues
- `npm run migrate:v3` - Run database migrations
- `npm run migrate:search` - Create search indexes

### Client (`cd client`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/health` - Server health check
- `POST /api/sellers/register` - Register new seller
- `POST /api/sellers/login` - Login seller
- `GET /api/search?q=query&lat=17.385&lon=78.486` - Search products
- `GET /api/products/shop/:shopId` - Get shop products

### Protected Endpoints (Require Authentication)
- `POST /api/shops` - Create shop
- `POST /api/products` - Create product
- `PATCH /api/shops/status` - Update shop status
- And more... (see server/README.md)

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in requests:

```javascript
headers: {
  'x-auth-token': 'your_jwt_token_here'
}
```

## 🗺️ Features

- 📍 **Location-based search** - Find shops and products near you
- 🔍 **Fuzzy text search** - Smart product and shop search
- 👤 **User authentication** - Secure seller registration and login
- 🏪 **Shop management** - Create and manage your shop
- 📦 **Product management** - Add, edit, and organize products
- 🏷️ **Categories** - Organize products by category
- 🕒 **Operating hours** - Set shop opening/closing times
- 📸 **Image uploads** - Add photos to shops and products

## 🔍 Troubleshooting

### Connection Issues

**Can't connect to database?**
```bash
cd server
npm run troubleshoot
```

This will diagnose:
- Environment variables
- DNS resolution
- Database connectivity
- Extension availability
- Schema existence

### Common Problems

1. **"Cannot find module 'pg'"** → Run `npm install` in server directory
2. **"Connection refused"** → Check if Supabase project is active
3. **"PostGIS not found"** → Enable PostGIS extension in Supabase
4. **"Too many connections"** → Use port 6543 (pooler mode)

See [SUPABASE_MIGRATION.md](SUPABASE_MIGRATION.md) for detailed troubleshooting.

## 📖 Documentation

- [Server README](server/README.md) - Backend setup and API docs
- [Supabase Migration Guide](SUPABASE_MIGRATION.md) - Detailed migration instructions
- [Client README](client/README.md) - Frontend setup

## 🔒 Security Notes

- Never commit `.env` files (already in `.gitignore`)
- Use strong JWT secrets (minimum 32 characters)
- Rotate database passwords regularly
- Use Supabase Row Level Security (RLS) for additional protection

## 🐛 Common Errors After Migration

### 1. Search Not Working
- **Cause**: pg_trgm extension not enabled
- **Fix**: Enable in Supabase Dashboard → Database → Extensions

### 2. Location Features Broken
- **Cause**: PostGIS extension not enabled
- **Fix**: Enable in Supabase Dashboard → Database → Extensions

### 3. Slow Queries
- **Cause**: Missing indexes
- **Fix**: Run `npm run migrate:search`

### 4. Authentication Fails
- **Cause**: JWT_SECRET not set or mismatched
- **Fix**: Check `.env` file has a proper JWT_SECRET

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license here]

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [SUPABASE_MIGRATION.md](SUPABASE_MIGRATION.md)
3. Run `npm run troubleshoot` for diagnostics
4. Check Supabase project status in dashboard

---

**Note**: This project was recently migrated from local PostgreSQL to Supabase. If you encounter any issues, please refer to the [migration guide](SUPABASE_MIGRATION.md) for detailed setup instructions.
