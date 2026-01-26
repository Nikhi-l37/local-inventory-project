// Mail utility for sending OTP emails using SendGrid HTTP API
const sgMail = require('@sendgrid/mail');

// ============================================
// SendGrid Configuration Validation
// ============================================
function validateSendGridConfig() {
  const required = ['SENDGRID_API_KEY', 'MAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const error = `
[MAIL] Missing SendGrid configuration variables:
  ${missing.map(key => `- ${key}`).join('\n  ')}

Please add these to your .env file:
  SENDGRID_API_KEY=SG.your_api_key_here
  MAIL_FROM=verified-sender@yourdomain.com

To get your SendGrid API key:
1. Sign up at https://signup.sendgrid.com/
2. Verify your email address
3. Go to Settings → API Keys
4. Click "Create API Key" with "Full Access"
5. Copy the API key (starts with SG.)
6. Verify your sender identity in SendGrid dashboard

See OTP_IMPLEMENTATION.md for detailed setup instructions.
    `.trim();
    
    throw new Error(error);
  }
}

// Validate SendGrid config on module load
validateSendGridConfig();

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send OTP email to seller using SendGrid HTTP API
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<object>} - Result from SendGrid API
 */
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.MAIL_FROM,
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
    const result = await sgMail.send(mailOptions);
    console.log(`[MAIL] ✅ OTP sent successfully to ${email}`);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error(`[MAIL] ❌ Failed to send OTP to ${email}:`, error.message);
    if (error.response) {
      console.error(`[MAIL] SendGrid error:`, error.response.body);
    }
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}

/**
 * Verify SendGrid configuration on startup
 * @returns {Promise<boolean>} - True if SendGrid is configured
 */
async function verifySMTPConfig() {
  try {
    // SendGrid doesn't have a verify() method, so just check if API key is set
    if (!process.env.SENDGRID_API_KEY || !process.env.MAIL_FROM) {
      throw new Error('SendGrid API key or MAIL_FROM not configured');
    }
    console.log('[MAIL] ✅ SendGrid configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[MAIL] ❌ SendGrid configuration error:', error.message);
    console.warn('[MAIL] Email functionality will not work. Check your SENDGRID_API_KEY and MAIL_FROM env variables.');
    return false;
  }
}

module.exports = {
  sendOTPEmail,
  verifySMTPConfig,
};
