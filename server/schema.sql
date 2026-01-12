-- Supabase Database Schema Setup
-- Run this in Supabase SQL Editor to create all required tables
-- This assumes you've already enabled PostGIS and pg_trgm extensions

-- ============================================
-- 1. Enable Required Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 2. Create Sellers Table
-- ============================================
CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);

-- ============================================
-- 3. Create Shops Table
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    location GEOMETRY(POINT, 4326), -- PostGIS geometry type for lat/long (compatible with both GEOMETRY and GEOGRAPHY operations)
    town_village VARCHAR(255),
    mandal VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    description TEXT,
    opening_time TIME,
    closing_time TIME,
    image_url VARCHAR(255),
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for shops
CREATE INDEX IF NOT EXISTS idx_shops_seller_id ON shops(seller_id);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category);
CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(name);

-- Fuzzy search indexes for shops (using pg_trgm)
CREATE INDEX IF NOT EXISTS idx_shops_name_trgm ON shops USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_shops_category_trgm ON shops USING GIN (category gin_trgm_ops);

-- ============================================
-- 4. Create Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, name) -- Each category name must be unique per shop
);

-- Index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_categories_shop_id ON categories(shop_id);

-- ============================================
-- 5. Create Products Table
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- Legacy category field (kept for backward compatibility)
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL, -- New category reference
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Fuzzy search indexes for products (using pg_trgm)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category_trgm ON products USING GIN (category gin_trgm_ops);

-- ============================================
-- 6. Create Updated At Trigger Function
-- ============================================
-- This function automatically updates the last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to products table
DROP TRIGGER IF EXISTS update_products_last_updated ON products;
CREATE TRIGGER update_products_last_updated
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- ============================================
-- 7. Verify Setup
-- ============================================
-- Check if all tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if extensions are enabled
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname IN ('postgis', 'pg_trgm');

-- Show indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Schema setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - sellers';
    RAISE NOTICE '  - shops';
    RAISE NOTICE '  - categories';
    RAISE NOTICE '  - products';
    RAISE NOTICE '';
    RAISE NOTICE 'Extensions enabled:';
    RAISE NOTICE '  - postgis';
    RAISE NOTICE '  - pg_trgm';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready to accept connections from your app!';
    RAISE NOTICE '========================================';
END $$;
