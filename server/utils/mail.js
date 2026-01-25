// Mail utility for sending OTP emails using Nodemailer
const nodemailer = require('nodemailer');

// ============================================
// SMTP Configuration Validation
// ============================================
function validateSMTPConfig() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const error = `
[MAIL] Missing SMTP configuration variables:
  ${missing.map(key => `- ${key}`).join('\n  ')}

Please add these to your .env file:
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-specific-password
  MAIL_FROM=noreply@localinventory.com

For Gmail: Use an app-specific password, not your main password.
For testing: Use Mailtrap.io (free tier available).

See OTP_IMPLEMENTATION.md for detailed SMTP setup instructions.
    `.trim();
    
    throw new Error(error);
  }
}

// Validate SMTP config on module load
validateSMTPConfig();

// Initialize transporter with SMTP credentials from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send OTP email to seller
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<object>} - Result from nodemailer
 */
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your Login OTP - Local Inventory',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; }
          .content { margin: 20px 0; color: #555; line-height: 1.6; }
          .otp-box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; font-family: monospace; }
          .expiry { color: #d9534f; font-weight: bold; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
          .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Login Verification</h2>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            <p>You requested to log in to your Local Inventory account. Use the OTP below to complete your login:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>OTP Details:</strong></p>
            <ul>
              <li>This OTP is valid for <span class="expiry">5 minutes</span></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this login, please ignore this email</li>
            </ul>
            
            <div class="warning">
              ⚠️ <strong>Security Notice:</strong> The Local Inventory team will never ask you for your OTP via email. This is only for you to use.
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 Local Inventory. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your Login OTP: ${otp}

This OTP is valid for 5 minutes.

Do not share this code with anyone.
If you didn't request this login, please ignore this email.

© 2025 Local Inventory
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] OTP sent successfully to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`[MAIL] Failed to send OTP to ${email}:`, error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}

/**
 * Verify SMTP configuration on startup
 * @returns {Promise<boolean>} - True if SMTP is configured and working
 */
async function verifySMTPConfig() {
  try {
    await transporter.verify();
    console.log('[MAIL] ✅ SMTP configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[MAIL] ❌ SMTP configuration error:', error.message);
    console.warn('[MAIL] Email functionality will not work. Check your SMTP_* env variables.');
    return false;
  }
}

module.exports = {
  sendOTPEmail,
  verifySMTPConfig,
};

/**
 * Send OTP email to seller
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<object>} - Result from nodemailer
 */
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your Login OTP - Local Inventory',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; }
          .content { margin: 20px 0; color: #555; line-height: 1.6; }
          .otp-box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; font-family: monospace; }
          .expiry { color: #d9534f; font-weight: bold; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
          .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Login Verification</h2>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            <p>You requested to log in to your Local Inventory account. Use the OTP below to complete your login:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>OTP Details:</strong></p>
            <ul>
              <li>This OTP is valid for <span class="expiry">5 minutes</span></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this login, please ignore this email</li>
            </ul>
            
            <div class="warning">
              ⚠️ <strong>Security Notice:</strong> The Local Inventory team will never ask you for your OTP via email. This is only for you to use.
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 Local Inventory. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your Login OTP: ${otp}

This OTP is valid for 5 minutes.

Do not share this code with anyone.
If you didn't request this login, please ignore this email.

© 2025 Local Inventory
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] OTP sent successfully to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`[MAIL] Failed to send OTP to ${email}:`, error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}

/**
 * Verify SMTP configuration on startup
 * @returns {Promise<boolean>} - True if SMTP is configured and working
 */
async function verifySMTPConfig() {
  try {
    await transporter.verify();
    console.log('[MAIL] SMTP configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[MAIL] SMTP configuration error:', error.message);
    console.warn('[MAIL] Email functionality will not work. Check your SMTP_* env variables.');
    return false;
  }
}

module.exports = {
  sendOTPEmail,
  verifySMTPConfig,
};
