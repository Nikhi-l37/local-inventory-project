-- Migration: Create seller_login_otp table for OTP-based login
-- Date: 2025-01-25
-- Description: This table stores OTP login challenges for 2FA/MFA implementation
-- Note: RLS is not enabled for this table; backend uses service role key for access

-- ============================================
-- 1. Create seller_login_otp Table
-- ============================================
CREATE TABLE IF NOT EXISTS seller_login_otp (
    id BIGSERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    resend_count INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT attempts_non_negative CHECK (attempts >= 0),
    CONSTRAINT resend_count_non_negative CHECK (resend_count >= 0),
    CONSTRAINT max_attempts_positive CHECK (max_attempts > 0)
);

-- ============================================
-- 2. Create Indexes
-- ============================================

-- Index for finding active OTP challenges by seller
CREATE INDEX IF NOT EXISTS idx_seller_login_otp_seller_created 
    ON seller_login_otp(seller_id, created_at DESC);

-- Index for expiry cleanup queries
CREATE INDEX IF NOT EXISTS idx_seller_login_otp_expires_at 
    ON seller_login_otp(expires_at);

-- Partial index for "active challenges" (not consumed and not expired)
CREATE INDEX IF NOT EXISTS idx_seller_login_otp_active 
    ON seller_login_otp(seller_id, created_at DESC)
    WHERE consumed_at IS NULL AND expires_at > NOW();

-- ============================================
-- 3. Verify Table Creation
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'seller_login_otp'
ORDER BY ordinal_position;
