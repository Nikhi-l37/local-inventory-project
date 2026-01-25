// OTP utility for generating, hashing, and validating OTPs
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ============================================
// OTP Configuration from Environment
// ============================================
const OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || '300'); // 5 minutes
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5');
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '30');
const OTP_MAX_RESENDS = parseInt(process.env.OTP_MAX_RESENDS || '3');

console.log('[OTP] Configuration loaded:');
console.log(`  - Expiry: ${OTP_EXPIRY_SECONDS}s (${OTP_EXPIRY_SECONDS / 60}m)`);
console.log(`  - Max attempts: ${OTP_MAX_ATTEMPTS}`);
console.log(`  - Resend cooldown: ${OTP_RESEND_COOLDOWN_SECONDS}s`);
console.log(`  - Max resends: ${OTP_MAX_RESENDS}`);

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP code
 */
function generateOTP() {
  const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Hash an OTP using bcrypt
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} - Hashed OTP
 */
async function hashOTP(otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

/**
 * Compare OTP with hash
 * @param {string} otp - Plain text OTP
 * @param {string} hash - Hashed OTP from database
 * @returns {Promise<boolean>} - True if OTP matches hash
 */
async function compareOTP(otp, hash) {
  return bcrypt.compare(otp, hash);
}

/**
 * Calculate OTP expiry (configurable seconds from now)
 * @returns {Date} - Expiry timestamp
 */
function getOTPExpiry() {
  const expiry = new Date();
  expiry.setSeconds(expiry.getSeconds() + OTP_EXPIRY_SECONDS);
  return expiry;
}

/**
 * Validate OTP challenge from database
 * @param {object} challenge - OTP challenge row from DB
 * @returns {object} - { valid: boolean, error: string | null }
 */
function validateChallenge(challenge) {
  if (!challenge) {
    return { valid: false, error: 'OTP challenge not found' };
  }

  if (challenge.consumed_at) {
    return { valid: false, error: 'OTP has already been used' };
  }

  const now = new Date();
  if (new Date(challenge.expires_at) < now) {
    return { valid: false, error: 'OTP has expired' };
  }

  if (challenge.attempts >= challenge.max_attempts) {
    return { valid: false, error: 'Maximum verification attempts exceeded' };
  }

  return { valid: true, error: null };
}

/**
 * Check if resend is allowed
 * @param {object} challenge - OTP challenge row from DB
 * @returns {object} - { allowed: boolean, error: string | null, cooldownSeconds: number }
 */
function canResend(challenge) {
  const now = new Date();
  const lastSent = challenge.last_sent_at ? new Date(challenge.last_sent_at) : new Date(challenge.created_at);
  const secondsSinceLastSend = Math.floor((now - lastSent) / 1000);

  if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
    return {
      allowed: false,
      error: `Please wait ${OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend}s before resending OTP`,
      cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend,
    };
  }

  if (challenge.resend_count >= OTP_MAX_RESENDS) {
    return {
      allowed: false,
      error: 'Maximum resend attempts exceeded',
      cooldownSeconds: 0,
    };
  }

  return {
    allowed: true,
    error: null,
    cooldownSeconds: 0,
  };
}

module.exports = {
  generateOTP,
  hashOTP,
  compareOTP,
  getOTPExpiry,
  validateChallenge,
  canResend,
};
