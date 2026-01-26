# Render Deployment Guide - OTP Feature

## Summary of Changes

This project has been updated to work on Render's free tier with OTP email functionality.

### What Changed:

1. **Database Connection**: Switched from SMTP to direct Supabase connection with SSL support
2. **Email Service**: Replaced Nodemailer (SMTP) with SendGrid HTTP API (works on free tier)
3. **Port Binding**: Server now uses `process.env.PORT` for Render compatibility

---

## Files Modified

### Backend:
- ✅ `server/db.js` - Added `DATABASE_SSL` support for direct Supabase connections
- ✅ `server/utils/mail.js` - Replaced Nodemailer with SendGrid HTTP API (`@sendgrid/mail`)
- ✅ `server/index.js` - Updated PORT to use `process.env.PORT || 3001`
- ✅ `server/package.json` - Replaced `nodemailer` with `@sendgrid/mail`
- ✅ `server/.env.example` - Updated with new SendGrid variables
- ✅ `server/.env` - Updated with SendGrid placeholders

### No Changes to API Endpoints:
- ✅ POST `/api/sellers/login` - Returns `{ otpRequired, challengeId, expiresIn }`
- ✅ POST `/api/sellers/verify-otp` - Verifies OTP and returns JWT
- ✅ POST `/api/sellers/resend-otp` - Sends new OTP

---

## Render Environment Variables (Updated)

### Step 1: Update Database Connection

**Change from pooler to direct connection:**

Go to your **Supabase Dashboard** → Settings → Database → Connection string (Direct)

Old (Pooler - causes timeout):
```
DATABASE_HOST=aws-1-ap-south-1.pooler.supabase.com
DATABASE_PORT=5432
```

New (Direct - works on free tier):
```
DATABASE_HOST=aws-1-ap-south-1.connect.aws-1-ap-south-1.prod.supabase.co
DATABASE_PORT=5432
DATABASE_SSL=true
```

### Step 2: Replace SMTP with SendGrid

**Remove these variables from Render:**
- ❌ `SMTP_HOST`
- ❌ `SMTP_PORT`
- ❌ `SMTP_SECURE`
- ❌ `SMTP_USER`
- ❌ `SMTP_PASS`

**Add these new variables:**
```
SENDGRID_API_KEY=SG.your_api_key_from_sendgrid
MAIL_FROM=praarjun594@gmail.com
```

### Complete Render Environment Variables List:

```
DATABASE_HOST=aws-1-ap-south-1.connect.aws-1-ap-south-1.prod.supabase.co
DATABASE_USER=postgres.bncaejsqmdkeovvkxwiw
DATABASE_NAME=postgres
DATABASE_PASSWORD=Nikhilreddy3446@
DATABASE_PORT=5432
DATABASE_SSL=true
JWT_SECRET=supersecretkey123
NODE_ENV=production
VITE_API_BASE_URL=/
SENDGRID_API_KEY=SG.your_api_key_here
MAIL_FROM=praarjun594@gmail.com
OTP_EXPIRY_SECONDS=300
OTP_RESEND_COOLDOWN_SECONDS=30
OTP_MAX_ATTEMPTS=5
OTP_MAX_RESENDS=3
```

---

## SendGrid Setup (Step-by-Step)

### 1. Create SendGrid Account
- Go to https://signup.sendgrid.com/
- Sign up (free tier: 100 emails/day)
- Verify your email

### 2. Create API Key
- Login → Settings → API Keys
- Click "Create API Key"
- Name: "Render OTP"
- Permissions: **Full Access**
- Copy the API key (starts with `SG.`)

### 3. Verify Sender Identity
- Go to Settings → Sender Authentication
- Click "Verify a Single Sender"
- Enter: `praarjun594@gmail.com`
- Check your email and verify

### 4. Add to Render
- Go to your Render service → Environment
- Add:
  - `SENDGRID_API_KEY` = `SG.your_copied_key`
  - `MAIL_FROM` = `praarjun594@gmail.com`
- Save Changes

---

## Deployment Steps

### 1. Push Code to GitHub
```bash
cd D:\projects\finder
git add .
git commit -m "Switch to SendGrid API and direct Supabase connection for Render"
git push origin main
```

### 2. Update Render Environment Variables
- Go to Render Dashboard → Your Service → Environment
- Update all variables listed above
- Click "Save Changes"

### 3. Render Will Auto-Deploy
- Watch the build logs
- Look for these success messages:
  ```
  Database Config:
    Host: aws-1-ap-south-1.connect...
    Port: 5432
    Database: postgres
    SSL Enabled: true
  ✓ Database connected successfully
  [MAIL] ✅ SendGrid configuration verified successfully
  ```

### 4. Test OTP Login
- Go to https://finder-xjof.onrender.com/login
- Enter email and password
- Should receive OTP email via SendGrid
- Enter OTP to complete login

---

## Troubleshooting

### Database Connection Timeout
❌ **Error**: `Connection terminated due to connection timeout`

✅ **Fix**: Make sure you're using **direct connection** (not pooler):
- Host should be: `*.connect.*.supabase.co` (not `*.pooler.supabase.com`)
- Port should be: `5432` (pooler uses 6543)
- `DATABASE_SSL=true` must be set

### SendGrid Email Not Sending
❌ **Error**: `Missing SendGrid configuration variables`

✅ **Fix**: 
1. Check `SENDGRID_API_KEY` starts with `SG.`
2. Check `MAIL_FROM` is verified in SendGrid dashboard
3. Check SendGrid free tier limit (100/day)

### Port Binding Error
❌ **Error**: `No open ports detected`

✅ **Fix**: Already fixed - server now uses `process.env.PORT`

---

## Why These Changes?

### Why Switch from SMTP to SendGrid HTTP API?
- Render's free tier **blocks SMTP ports** (25, 465, 587, 2525)
- SendGrid HTTP API uses **HTTPS (port 443)** - not blocked
- More reliable and faster than SMTP
- Free tier: 100 emails/day (plenty for OTP)

### Why Switch from Pooler to Direct Connection?
- Pooler has stricter timeouts on free tier
- Direct connection more reliable
- SSL required for production security

---

## Testing Checklist

After deployment, test:
- ✅ Register new seller
- ✅ Login (should send OTP email)
- ✅ Check email inbox for OTP
- ✅ Verify OTP (should get JWT token)
- ✅ Resend OTP (wait 30s cooldown)
- ✅ Test expired OTP (wait 5 min)
- ✅ Test wrong OTP (5 attempts limit)

---

## Cost Summary

| Service | Free Tier | Cost |
|---------|-----------|------|
| Render | 750 hours/month | $0 |
| Supabase | 500MB DB, 1GB transfer | $0 |
| SendGrid | 100 emails/day | $0 |
| **Total** | - | **$0/month** |

---

## Support

If you encounter issues:
1. Check Render logs for specific errors
2. Verify all environment variables are set correctly
3. Test SendGrid API key with `curl`:
   ```bash
   curl -X POST https://api.sendgrid.com/v3/mail/send \
     -H "Authorization: Bearer SG.your_key" \
     -H "Content-Type: application/json" \
     -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"praarjun594@gmail.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
   ```
