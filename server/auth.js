// This file will handle all /api/sellers routes (register, login, OTP verification)
const express = require('express');
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For creating tokens
const rateLimit = require('express-rate-limit');
const pool = require('./db'); // Our database connection
const { sendOTPEmail } = require('./utils/mail');
const { generateOTP, hashOTP, compareOTP, getOTPExpiry, validateChallenge, canResend } = require('./utils/otp');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} = require('./middleware/validation');

const router = express.Router();

// ============================================
// RATE LIMITING
// ============================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOTPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const resendOTPLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 resend attempts per window
  message: 'Too many resend requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// ROUTE: POST /api/sellers/register
// PURPOSE: To register a new seller
// ============================================
router.post('/register', validateRegister, async (req, res) => {
  try {
    // 1. Get the email and password from the request body
    const { email, password } = req.body;

    // 2. Check if the user already exists
    const user = await pool.query('SELECT * FROM sellers WHERE email = $1', [email]);
    if (user.rows.length > 0) {
      return res.status(401).send('Seller already exists.');
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Save the new seller to the database
    const newSeller = await pool.query(
      'INSERT INTO sellers (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );

    // 5. Create a JWT token
    // (We'll store the seller's ID in the token)
    const token = jwt.sign(
      { sellerId: newSeller.rows[0].id },
      process.env.JWT_SECRET // FIXED: Use ENV variable
    );

    // 6. Send the token back to the user
    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ============================================
// ROUTE: POST /api/sellers/login (STEP 1)
// PURPOSE: Verify email/password and send OTP
// ============================================
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    // 1. Get the email and password from the request body
    const { email, password } = req.body;

    // 2. Check if the seller exists in the database
    const user = await pool.query('SELECT * FROM sellers WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      // Generic error for security (don't want to say "user not found")
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const seller = user.rows[0];

    // 3. Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, seller.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 4. Generate OTP and hash it
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // 5. Create OTP challenge in database
    const otpChallenge = await pool.query(
      `INSERT INTO seller_login_otp 
       (seller_id, otp_hash, expires_at, attempts, max_attempts, resend_count, created_at, last_sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, expires_at`,
      [seller.id, otpHash, expiresAt, 0, 5, 0]
    );

    const challengeId = otpChallenge.rows[0].id;

    // 6. Send OTP via email
    try {
      await sendOTPEmail(email, otp);
    } catch (mailError) {
      console.error('[AUTH] Failed to send OTP email:', mailError.message);
      // Still return the challenge ID, but notify client of mail failure
      return res.status(200).json({
        otpRequired: true,
        challengeId,
        expiresIn: 300,
        warning: 'OTP generated but email delivery failed. Check SMTP configuration.',
      });
    }

    // 7. Return OTP challenge info (NO JWT yet)
    res.json({
      otpRequired: true,
      challengeId,
      expiresIn: 300, // 5 minutes in seconds
    });

  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ROUTE: POST /api/sellers/verify-otp (STEP 2)
// PURPOSE: Verify OTP and issue JWT token
// ============================================
router.post('/verify-otp', verifyOTPLimiter, async (req, res) => {
  try {
    const { challengeId, otp } = req.body;

    // 1. Validate input
    if (!challengeId || !otp) {
      return res.status(400).json({ error: 'Challenge ID and OTP are required' });
    }

    // 2. Fetch the challenge from database
    const challengeResult = await pool.query(
      'SELECT * FROM seller_login_otp WHERE id = $1',
      [challengeId]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(400).json({ error: 'OTP challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    // 3. Validate challenge status
    const validation = validateChallenge(challenge);
    if (!validation.valid) {
      // Increment attempts only if not already consumed or expired
      if (!challenge.consumed_at) {
        await pool.query(
          'UPDATE seller_login_otp SET attempts = attempts + 1 WHERE id = $1',
          [challengeId]
        );
      }
      return res.status(400).json({ error: validation.error });
    }

    // 4. Compare OTP with hash
    const isOTPValid = await compareOTP(otp, challenge.otp_hash);
    if (!isOTPValid) {
      // Increment attempts
      const updatedChallenge = await pool.query(
        'UPDATE seller_login_otp SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts, max_attempts',
        [challengeId]
      );

      const { attempts, max_attempts } = updatedChallenge.rows[0];
      const remainingAttempts = max_attempts - attempts;

      return res.status(400).json({
        error: 'Invalid OTP',
        attemptsRemaining: remainingAttempts,
      });
    }

    // 5. OTP is valid! Mark as consumed and get seller info
    await pool.query(
      'UPDATE seller_login_otp SET consumed_at = NOW() WHERE id = $1',
      [challengeId]
    );

    // 6. Fetch seller details
    const sellerResult = await pool.query(
      'SELECT id, email FROM sellers WHERE id = $1',
      [challenge.seller_id]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(500).json({ error: 'Seller not found' });
    }

    const seller = sellerResult.rows[0];

    // 7. Create JWT token
    const token = jwt.sign(
      { sellerId: seller.id },
      process.env.JWT_SECRET
    );

    // 8. Return token and seller info
    res.json({
      token,
      seller: {
        id: seller.id,
        email: seller.email,
      },
    });

  } catch (err) {
    console.error('[AUTH] OTP verification error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ROUTE: POST /api/sellers/resend-otp
// PURPOSE: Resend OTP with new code
// ============================================
router.post('/resend-otp', resendOTPLimiter, async (req, res) => {
  try {
    const { challengeId } = req.body;

    // 1. Validate input
    if (!challengeId) {
      return res.status(400).json({ error: 'Challenge ID is required' });
    }

    // 2. Fetch the challenge
    const challengeResult = await pool.query(
      'SELECT * FROM seller_login_otp WHERE id = $1',
      [challengeId]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(400).json({ error: 'OTP challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    // 3. Check if challenge is already consumed
    if (challenge.consumed_at) {
      return res.status(400).json({ error: 'This OTP has already been used' });
    }

    // 4. Check resend permissions
    const resendCheck = canResend(challenge);
    if (!resendCheck.allowed) {
      return res.status(400).json({
        error: resendCheck.error,
        cooldownSeconds: resendCheck.cooldownSeconds,
      });
    }

    // 5. Generate new OTP
    const newOTP = generateOTP();
    const newOTPHash = await hashOTP(newOTP);
    const newExpiresAt = getOTPExpiry();

    // 6. Update challenge with new OTP
    const updatedChallenge = await pool.query(
      `UPDATE seller_login_otp 
       SET otp_hash = $1, expires_at = $2, resend_count = resend_count + 1, last_sent_at = NOW(), attempts = 0
       WHERE id = $3
       RETURNING seller_id, resend_count`,
      [newOTPHash, newExpiresAt, challengeId]
    );

    const { seller_id } = updatedChallenge.rows[0];

    // 7. Fetch seller email
    const sellerResult = await pool.query(
      'SELECT email FROM sellers WHERE id = $1',
      [seller_id]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(500).json({ error: 'Seller not found' });
    }

    const sellerEmail = sellerResult.rows[0].email;

    // 8. Send new OTP via email
    try {
      await sendOTPEmail(sellerEmail, newOTP);
    } catch (mailError) {
      console.error('[AUTH] Failed to resend OTP email:', mailError.message);
      return res.status(500).json({
        error: 'Failed to send OTP email. Check SMTP configuration.',
      });
    }

    // 9. Return success
    res.json({
      ok: true,
      expiresIn: 300, // 5 minutes in seconds
      message: 'New OTP sent to your email',
    });

  } catch (err) {
    console.error('[AUTH] Resend OTP error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});




router.post('/forgot-password', validateForgotPassword, async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find the user by email
    const user = await pool.query('SELECT * FROM sellers WHERE email = $1', [email]);

    // 2. IMPORTANT: Even if the user is NOT found, we send a "success" message.
    if (user.rows.length === 0) {
      console.log(`(Password reset requested for non-existent user: ${email})`);
      return res.json({ msg: 'If an account with this email exists, a reset link has been sent.' });
    }

    const sellerId = user.rows[0].id;

    // 3. Create a special, short-lived token for password reset
    const resetToken = jwt.sign(
      { sellerId: sellerId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Make the token last only 15 minutes!
    );

    // 4. Create the full reset link (Client URL is hardcoded for dev simplicity)
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    // 5. --- THIS IS OUR "FAKE EMAIL" ---
    // Log the link to the console for the developer/user to copy
    console.log('=============== PASSWORD RESET ================');
    console.log(`Reset link for ${email}:`);
    console.log(resetLink);
    console.log('===============================================');

    res.json({ msg: 'If an account with this email exists, a reset link has been sent.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// ROUTE: POST /api/sellers/reset-password/:token
// PURPOSE: To set a new password using a valid token
router.post('/reset-password/:token', validateResetPassword, async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Verify the token is valid and not expired
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ msg: 'Token is invalid or has expired.' });
    }

    // 2. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Update the seller's password in the database
    await pool.query(
      'UPDATE sellers SET password_hash = $1 WHERE id = $2',
      [passwordHash, decoded.sellerId]
    );

    res.json({ msg: 'Password has been reset successfully. You can now log in.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;