# OTP (One-Time Password) Login Implementation

## Overview

This project now implements secure 2-step OTP-based login using email verification. The implementation includes:

- **Step 1**: Email + Password verification
- **Step 2**: 6-digit OTP sent to email
- **Rate Limiting**: Protection against brute force attacks
- **Resend Support**: Limited OTP resend capability

---

## Architecture

### Database Schema

**Table**: `seller_login_otp`

```sql
CREATE TABLE seller_login_otp (
    id BIGSERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    otp_hash VARCHAR(255) NOT NULL,          -- Bcrypt hashed OTP
    expires_at TIMESTAMPTZ NOT NULL,         -- Expiry timestamp
    attempts INTEGER NOT NULL DEFAULT 0,     -- Verification attempt count
    max_attempts INTEGER NOT NULL DEFAULT 5, -- Max allowed attempts
    resend_count INTEGER NOT NULL DEFAULT 0, -- Resend count
    last_sent_at TIMESTAMPTZ,               -- Last OTP send time
    consumed_at TIMESTAMPTZ,                -- When OTP was used
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `(seller_id, created_at DESC)` - Find recent OTP challenges
- `(expires_at)` - Cleanup expired challenges
- Partial index on `(seller_id, created_at DESC) WHERE consumed_at IS NULL AND expires_at > NOW()` - Active challenges

**RLS Status**: ❌ NOT ENABLED (Backend access via Supabase regular pool)

---

## Environment Variables

Add these to `.env`:

```env
# SMTP Configuration (for OTP email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
MAIL_FROM=noreply@localinventory.com

# (Optional) Supabase service role key (if using service role access)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### SMTP Setup Examples

#### Gmail
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password at: https://myaccount.google.com/apppasswords
3. Use the 16-character password as `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
MAIL_FROM=noreply@localinventory.com
```

#### Mailtrap (for testing)
1. Create account at https://mailtrap.io
2. Copy SMTP credentials from Dashboard

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_username
SMTP_PASS=your_password
MAIL_FROM=test@example.com
```

---

## OTP Rules

| Rule | Value |
|------|-------|
| OTP Format | 6-digit numeric (000000 - 999999) |
| Validity | 5 minutes (300 seconds) |
| Hash Algorithm | bcryptjs (cost factor 10) |
| Max Verification Attempts | 5 |
| Resend Cooldown | 30 seconds |
| Max Resends | 3 |

---

## API Endpoints

### 1. Step 1: Login (Email + Password)

**POST** `/api/sellers/login`

**Request**:
```json
{
  "email": "seller@example.com",
  "password": "securePassword123"
}
```

**Response (Success - OTP Required)**:
```json
{
  "otpRequired": true,
  "challengeId": 42,
  "expiresIn": 300
}
```

**Response (Email Send Failed)**:
```json
{
  "otpRequired": true,
  "challengeId": 42,
  "expiresIn": 300,
  "warning": "OTP generated but email delivery failed. Check SMTP configuration."
}
```

**Response (Error)**:
```json
{
  "error": "Invalid credentials."
}
```

**Status Codes**:
- `200`: OTP challenge created, awaiting verification
- `401`: Invalid email or password
- `429`: Too many login attempts (rate limited)
- `500`: Server error

---

### 2. Step 2: Verify OTP

**POST** `/api/sellers/verify-otp`

**Request**:
```json
{
  "challengeId": 42,
  "otp": "123456"
}
```

**Response (Success)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "seller": {
    "id": 1,
    "email": "seller@example.com"
  }
}
```

**Response (Invalid OTP)**:
```json
{
  "error": "Invalid OTP",
  "attemptsRemaining": 3
}
```

**Response (Expired OTP)**:
```json
{
  "error": "OTP has expired"
}
```

**Response (Max Attempts)**:
```json
{
  "error": "Maximum verification attempts exceeded"
}
```

**Status Codes**:
- `200`: Login successful, JWT token issued
- `400`: Invalid/expired OTP or invalid challenge
- `429`: Too many verification attempts (rate limited)
- `500`: Server error

---

### 3. Resend OTP

**POST** `/api/sellers/resend-otp`

**Request**:
```json
{
  "challengeId": 42
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "expiresIn": 300,
  "message": "New OTP sent to your email"
}
```

**Response (Cooldown Active)**:
```json
{
  "error": "Please wait 15s before resending OTP",
  "cooldownSeconds": 15
}
```

**Response (Max Resends)**:
```json
{
  "error": "Maximum resend attempts exceeded"
}
```

**Status Codes**:
- `200`: New OTP generated and sent
- `400`: Resend not allowed (cooldown/max resends)
- `429`: Too many resend requests (rate limited)
- `500`: Server error (email send failed)

---

## Rate Limiting

All OTP endpoints are rate limited using `express-rate-limit`:

| Endpoint | Window | Limit |
|----------|--------|-------|
| `/api/sellers/login` | 15 min | 5 requests |
| `/api/sellers/verify-otp` | 15 min | 10 requests |
| `/api/sellers/resend-otp` | 5 min | 5 requests |

---

## File Structure

```
server/
├── auth.js                    # OTP endpoints & login logic
├── utils/
│   ├── mail.js               # Nodemailer service
│   └── otp.js                # OTP generation & validation
├── middleware/
│   └── ... (existing)
├── .env.example              # SMTP configuration template
└── package.json              # Added: nodemailer, express-rate-limit

client/
├── src/pages/
│   ├── Auth.jsx              # Updated: 2-step flow
│   └── Auth.module.css       # Updated: OTP styles

supabase/
└── migrations/
    └── 20250125000001_create_seller_login_otp.sql
```

---

## Implementation Details

### Security Features

1. **OTP Hashing**: OTPs are hashed using bcryptjs before storage (never stored in plaintext)
2. **Attempt Tracking**: Failed verification attempts are tracked and limited
3. **Expiry Enforcement**: Expired OTPs are rejected immediately
4. **Consumed Flag**: Successfully used OTPs are marked and cannot be reused
5. **Rate Limiting**: Prevents brute force attacks on login, verify, and resend endpoints
6. **Resend Cooldown**: Enforces 30-second cooldown between resends
7. **SMTP Authentication**: Email sending is protected by SMTP credentials

### Email Content

The OTP email includes:

- Clean HTML formatting with dark mode support
- Clear OTP code display (6 digits, monospace)
- Expiry time (5 minutes)
- Security notice
- Unsubscribe info

### Frontend Flow

1. **Step 1 Form**: Email & Password input
   - On submit, calls `/api/sellers/login`
   - Stores `challengeId` in state
   - Switches to Step 2 UI

2. **Step 2 Form**: 6-digit OTP input
   - Real-time digit formatting (numbers only, max 6)
   - Countdown timer showing OTP validity
   - Attempt counter
   - Resend button with 30-second cooldown

3. **Error Handling**:
   - Friendly error messages for all failure scenarios
   - Cooldown timers for rate limiting feedback
   - Email failure warnings

---

## Testing & Verification

### Manual Testing Checklist

- [ ] SMTP credentials configured correctly in `.env`
- [ ] `npm install` completed (installed `nodemailer` & `express-rate-limit`)
- [ ] Migration SQL executed in Supabase: `supabase/migrations/20250125000001_create_seller_login_otp.sql`
- [ ] Backend running: `npm run dev` (in `server/`)
- [ ] Frontend running: `npm run dev` (in `client/`)
- [ ] Navigate to Login page
- [ ] Enter valid seller email & password → Should receive OTP email
- [ ] Enter correct OTP → Should redirect to dashboard
- [ ] Test wrong OTP → Should show error with attempts remaining
- [ ] Test OTP expiry → Wait 5+ minutes, try old OTP
- [ ] Test resend → Should send new OTP (respects 30s cooldown)
- [ ] Test rate limiting → Rapidly submit login → Should get 429 error
- [ ] Test registration → Register new seller → Should trigger OTP flow

### Debug Steps

If OTP email isn't sending:

1. Check SMTP credentials in `.env`:
   ```bash
   npm run troubleshoot  # Shows database connection status
   ```

2. Verify mail service starts:
   ```javascript
   // In server/index.js or startup script, call:
   const { verifySMTPConfig } = require('./utils/mail');
   await verifySMTPConfig();
   ```

3. Check server console for `[MAIL]` log messages

4. Use Mailtrap for testing (easier to debug):
   - Create account at https://mailtrap.io
   - Use their SMTP credentials
   - Check "Email Logs" tab in Mailtrap dashboard

---

## Security Considerations

1. **OTP Length**: 6 digits provides ~1 million combinations (sufficient for 5-min expiry + attempt limits)
2. **Expiry Time**: 5 minutes balances usability vs. security
3. **Bcrypt Hashing**: OTP hashing is intentionally slow (cost 10) to resist precomputation attacks
4. **Rate Limiting**: Prevents brute force attempts across all endpoints
5. **Consume Flag**: Ensures OTP can only be used once
6. **Service Role Access**: Backend uses Supabase regular pool (not public, not service role key for RLS)

---

## Troubleshooting

### "Failed to send OTP email"

**Cause**: SMTP configuration incorrect

**Solution**:
1. Verify `.env` has all SMTP variables
2. For Gmail: Use App Password, not regular password
3. For Mailtrap: Double-check credentials from dashboard
4. Test SMTP connection:
   ```javascript
   const { verifySMTPConfig } = require('./utils/mail');
   verifySMTPConfig().then(ok => console.log('SMTP OK:', ok));
   ```

### "OTP has expired" immediately

**Cause**: Server/Client time mismatch or clock skew

**Solution**:
1. Sync system clock
2. Verify server timezone is set correctly
3. Check Supabase database timezone (should be UTC)

### "Maximum verification attempts exceeded"

**Cause**: User entered wrong OTP 5+ times

**Solution**:
1. User must request new OTP via Resend button
2. Resend resets attempts counter to 0

### "Please wait Xs before resending OTP"

**Cause**: User attempted resend too quickly

**Solution**:
1. Wait 30 seconds between resend attempts
2. Can resend maximum 3 times per login challenge
3. After 3 resends, user must start fresh login

---

## Migration from Old Login

If you had existing sellers using token-based login:

1. Old login mechanism is preserved (register still works directly)
2. All new logins after this update will use OTP
3. No migration needed for existing seller records
4. Old sellers can login with email/password → OTP flow

---

## Future Enhancements

Potential improvements:

- [ ] SMS OTP delivery (Twilio integration)
- [ ] Backup codes for account recovery
- [ ] TOTP (Time-based OTP) for desktop apps
- [ ] Whitelist trusted devices (skip OTP for 30 days)
- [ ] Email template customization
- [ ] OTP delivery logs/audit trail
- [ ] Multi-factor authentication (OTP + security key)

---

## Support

For issues or questions:

1. Check server logs for `[AUTH]` and `[MAIL]` prefixes
2. Review error messages returned by API endpoints
3. Verify `.env` configuration
4. Test SMTP connectivity independently
5. Check Supabase database for `seller_login_otp` table
