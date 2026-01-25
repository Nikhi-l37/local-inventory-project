# OTP Login API Documentation

## Overview

This document provides detailed API specifications for the new OTP-based login system.

---

## Authentication Flow

```
User Input (Email + Password)
        ↓
  /api/sellers/login (Step 1)
        ↓
  Verify Credentials
        ↓
  Generate OTP & Send Email
        ↓
  Return challengeId + expiry
        ↓
  User Input (6-digit OTP)
        ↓
  /api/sellers/verify-otp (Step 2)
        ↓
  Validate OTP Challenge
        ↓
  Issue JWT Token
        ↓
  Redirect to Dashboard
```

---

## Endpoints

### 1. POST /api/sellers/login

**Step 1: Verify email/password and initiate OTP flow**

#### Request

```http
POST /api/sellers/login HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "email": "seller@example.com",
  "password": "MySecurePassword123"
}
```

#### Success Response (200 OK)

```json
{
  "otpRequired": true,
  "challengeId": 42,
  "expiresIn": 300
}
```

**Fields**:
- `otpRequired` (boolean): Always true if credentials are valid
- `challengeId` (number): Unique ID for this OTP challenge (use for verify & resend)
- `expiresIn` (number): OTP validity in seconds (300 = 5 minutes)

#### Success Response with Warning (200 OK)

If email send fails (SMTP misconfigured):

```json
{
  "otpRequired": true,
  "challengeId": 42,
  "expiresIn": 300,
  "warning": "OTP generated but email delivery failed. Check SMTP configuration."
}
```

Client should still proceed to Step 2, but inform user of the issue.

#### Error Response - Invalid Credentials (401 Unauthorized)

```json
{
  "error": "Invalid credentials."
}
```

#### Error Response - Rate Limited (429 Too Many Requests)

```json
{
  "message": "Too many login attempts, please try again later"
}
```

Limit: 5 attempts per 15 minutes per IP

#### Error Response - Server Error (500 Internal Server Error)

```json
{
  "error": "Server error"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3001/api/sellers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "MySecurePassword123"
  }'
```

#### JavaScript/Fetch Example

```javascript
const response = await fetch('/api/sellers/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'seller@example.com',
    password: 'MySecurePassword123'
  })
});

const data = await response.json();

if (response.ok && data.otpRequired) {
  // Move to Step 2: OTP verification
  console.log('OTP Challenge ID:', data.challengeId);
  console.log('Expires in:', data.expiresIn, 'seconds');
} else {
  console.error('Login failed:', data.error);
}
```

---

### 2. POST /api/sellers/verify-otp

**Step 2: Verify OTP and complete login**

#### Request

```http
POST /api/sellers/verify-otp HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "challengeId": 42,
  "otp": "123456"
}
```

**Fields**:
- `challengeId` (number): From Step 1 response
- `otp` (string): 6-digit code user received in email

#### Success Response (200 OK)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWxsZXJJZCI6MSwiZXhwIjoxNzM3NzcyMzIwfQ.abc123...",
  "seller": {
    "id": 1,
    "email": "seller@example.com"
  }
}
```

**Fields**:
- `token` (string): JWT token for authenticated requests
- `seller.id` (number): Seller ID
- `seller.email` (string): Seller email

**Next Steps**:
1. Store token in `localStorage` or session
2. Use token in `Authorization: Bearer <token>` header for subsequent requests
3. Redirect to `/dashboard`

#### Error Response - Invalid OTP (400 Bad Request)

```json
{
  "error": "Invalid OTP",
  "attemptsRemaining": 3
}
```

**Fields**:
- `error` (string): Error message
- `attemptsRemaining` (number): Attempts left before lockout

#### Error Response - OTP Expired (400 Bad Request)

```json
{
  "error": "OTP has expired"
}
```

User must start over: go back to Step 1.

#### Error Response - Too Many Attempts (400 Bad Request)

```json
{
  "error": "Maximum verification attempts exceeded"
}
```

User must click "Resend OTP" to get a new challenge.

#### Error Response - Challenge Not Found (400 Bad Request)

```json
{
  "error": "OTP challenge not found"
}
```

Invalid `challengeId` or it was already consumed.

#### Error Response - Missing Fields (400 Bad Request)

```json
{
  "error": "Challenge ID and OTP are required"
}
```

#### Error Response - Rate Limited (429 Too Many Requests)

```json
{
  "message": "Too many verification attempts, please try again later"
}
```

Limit: 10 attempts per 15 minutes per IP

#### Error Response - Server Error (500 Internal Server Error)

```json
{
  "error": "Server error"
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3001/api/sellers/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": 42,
    "otp": "123456"
  }'
```

#### JavaScript/Fetch Example

```javascript
const response = await fetch('/api/sellers/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challengeId: 42,
    otp: '123456'
  })
});

const data = await response.json();

if (response.ok) {
  // Login successful!
  localStorage.setItem('token', data.token);
  localStorage.setItem('sellerId', data.seller.id);
  window.location.href = '/dashboard';
} else if (response.status === 400) {
  console.error(data.error);
  if (data.attemptsRemaining !== undefined) {
    console.log('Attempts remaining:', data.attemptsRemaining);
  }
} else {
  console.error('Verification failed:', data.error);
}
```

---

### 3. POST /api/sellers/resend-otp

**Resend OTP with a new code**

#### Request

```http
POST /api/sellers/resend-otp HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "challengeId": 42
}
```

**Fields**:
- `challengeId` (number): From Step 1 response

#### Success Response (200 OK)

```json
{
  "ok": true,
  "expiresIn": 300,
  "message": "New OTP sent to your email"
}
```

**Fields**:
- `ok` (boolean): Success indicator
- `expiresIn` (number): New OTP validity in seconds
- `message` (string): Human-readable message

**Notes**:
- A brand new OTP code is generated and sent
- Verification attempt counter is reset to 0
- Resend counter is incremented
- 30-second cooldown is enforced between resends

#### Error Response - Already Used (400 Bad Request)

```json
{
  "error": "This OTP has already been used"
}
```

User must start a new login.

#### Error Response - Resend Cooldown (400 Bad Request)

```json
{
  "error": "Please wait 15s before resending OTP",
  "cooldownSeconds": 15
}
```

**Fields**:
- `cooldownSeconds` (number): Seconds until next resend is allowed

#### Error Response - Max Resends Exceeded (400 Bad Request)

```json
{
  "error": "Maximum resend attempts exceeded"
}
```

User has resent OTP 3 times already. They must start a new login.

#### Error Response - Challenge Not Found (400 Bad Request)

```json
{
  "error": "OTP challenge not found"
}
```

Invalid `challengeId`.

#### Error Response - Missing Fields (400 Bad Request)

```json
{
  "error": "Challenge ID is required"
}
```

#### Error Response - Email Send Failed (500 Internal Server Error)

```json
{
  "error": "Failed to send OTP email. Check SMTP configuration."
}
```

The new OTP was created but email delivery failed. Check server logs.

#### Error Response - Rate Limited (429 Too Many Requests)

```json
{
  "message": "Too many resend requests, please try again later"
}
```

Limit: 5 attempts per 5 minutes per IP

#### cURL Example

```bash
curl -X POST http://localhost:3001/api/sellers/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": 42
  }'
```

#### JavaScript/Fetch Example

```javascript
const response = await fetch('/api/sellers/resend-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challengeId: 42
  })
});

const data = await response.json();

if (response.ok) {
  // New OTP sent!
  console.log('New OTP sent to email');
  // Reset UI countdown timer to 300 seconds
  // Start 30-second cooldown on Resend button
} else if (response.status === 400) {
  if (data.cooldownSeconds) {
    console.log(`Please wait ${data.cooldownSeconds}s before resending`);
  } else {
    console.error(data.error);
  }
} else {
  console.error('Resend failed:', data.error);
}
```

---

## Common Workflows

### Workflow 1: Successful Login

```
1. POST /api/sellers/login
   ← { otpRequired: true, challengeId: 42, expiresIn: 300 }

2. [User receives OTP email with code "123456"]

3. POST /api/sellers/verify-otp
   → { challengeId: 42, otp: "123456" }
   ← { token: "...", seller: { id: 1, email: "..." } }

4. Store token and redirect to /dashboard
```

### Workflow 2: Wrong OTP

```
1. POST /api/sellers/verify-otp
   → { challengeId: 42, otp: "000000" }
   ← 400 { error: "Invalid OTP", attemptsRemaining: 4 }

2. User corrects and tries again (3 attempts left, etc.)

3. After 5 failures:
   ← 400 { error: "Maximum verification attempts exceeded" }

4. User clicks "Resend OTP" to get fresh attempt counter
```

### Workflow 3: Resend OTP

```
1. POST /api/sellers/resend-otp
   → { challengeId: 42 }
   ← 200 { ok: true, expiresIn: 300, message: "New OTP sent to your email" }

2. [Resend button becomes disabled for 30 seconds]

3. User receives new OTP email

4. POST /api/sellers/verify-otp with new code
```

### Workflow 4: OTP Expired

```
1. User waits 5+ minutes without entering OTP

2. POST /api/sellers/verify-otp
   → { challengeId: 42, otp: "123456" }
   ← 400 { error: "OTP has expired" }

3. User must start fresh login:
   - Go back to Step 1 (email/password)
   - POST /api/sellers/login again
   - Get new challengeId
```

---

## Rate Limiting

All OTP endpoints have rate limiting enabled:

| Endpoint | Window | Limit | Response |
|----------|--------|-------|----------|
| POST /api/sellers/login | 15 min | 5 | 429 Too Many Requests |
| POST /api/sellers/verify-otp | 15 min | 10 | 429 Too Many Requests |
| POST /api/sellers/resend-otp | 5 min | 5 | 429 Too Many Requests |

Rate limiting is per IP address. Response header includes retry information:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1737772800
```

---

## Error Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | OTP sent, OTP verified, OTP resent |
| 400 | Bad Request | Invalid OTP, expired OTP, missing fields |
| 401 | Unauthorized | Invalid email/password |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Database error, SMTP failure |

---

## Best Practices for Frontend

1. **Store challengeId in state, not localStorage**
   - It's session-specific and short-lived
   - Don't persist across page reloads

2. **Implement countdown timer**
   - Show remaining OTP validity (0-300 seconds)
   - Update every second
   - Warn user at 1 minute remaining

3. **Implement resend cooldown**
   - Show "Resend in Xs" for 30 seconds after resend
   - Disable button during cooldown
   - Track attempts (max 3)

4. **Handle all error messages gracefully**
   - Show user-friendly messages
   - Don't expose server details
   - Offer "Resend OTP" or "Back to Login" buttons

5. **Format OTP input**
   - Accept numbers only (0-9)
   - Auto-format: "12 34 56" or "123456"
   - Max length: 6 characters

6. **Use proper HTTP methods**
   - Always POST (never GET)
   - Set Content-Type: application/json
   - Use JSON request/response format

7. **Handle token securely**
   - Store in localStorage or sessionStorage (not cookies for simplicity)
   - Include in Authorization header: `Authorization: Bearer <token>`
   - Clear on logout

---

## Testing with cURL

### Full Login Flow

```bash
# Step 1: Get OTP challenge
CHALLENGE=$(curl -s -X POST http://localhost:3001/api/sellers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "password123"
  }' | jq -r '.challengeId')

echo "Challenge ID: $CHALLENGE"
echo "Check email for OTP..."
read -p "Enter OTP: " OTP

# Step 2: Verify OTP
curl -s -X POST http://localhost:3001/api/sellers/verify-otp \
  -H "Content-Type: application/json" \
  -d "{
    \"challengeId\": $CHALLENGE,
    \"otp\": \"$OTP\"
  }" | jq .
```

### Resend OTP

```bash
CHALLENGE=42  # From Step 1

curl -X POST http://localhost:3001/api/sellers/resend-otp \
  -H "Content-Type: application/json" \
  -d "{
    \"challengeId\": $CHALLENGE
  }"
```

---

## Troubleshooting

### "OTP has expired" immediately
- Check system clock synchronization
- Verify server timezone (should be UTC)
- Check Supabase database timezone

### "Failed to send OTP email"
- Verify SMTP credentials in `.env`
- Check firewall/network connectivity to SMTP server
- Use Mailtrap for testing (easier debugging)

### Rate limiting blocking legitimate users
- Check RateLimit-Reset header for when limit clears
- Rate limits are per IP (not per account)
- Legitimate users should succeed after waiting

### "Maximum verification attempts exceeded"
- User must click "Resend OTP" to get fresh challenge
- Or start new login (new challengeId)

---

## Additional Resources

- See [OTP_IMPLEMENTATION.md](../OTP_IMPLEMENTATION.md) for full feature documentation
- Check [server/utils/otp.js](../server/utils/otp.js) for validation logic
- Check [server/utils/mail.js](../server/utils/mail.js) for email handling
