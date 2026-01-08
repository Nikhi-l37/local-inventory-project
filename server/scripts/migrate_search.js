const dotenv = require('dotenv');
const path = require('path');

// Load environment variables explicitly BEFORE importing db
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../db');

async function migrateSearch() {
    try {
        console.log('Connecting to DB...');
        console.log(`Host: ${process.env.DATABASE_HOST}`);

        // 1. Enable Extension
        console.log('Enabling pg_trgm extension...');
        await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        // 2. Add Indexes for Shops
        console.log('Creating indexes for shops...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_shops_name_trgm ON shops USING GIN (name gin_trgm_ops)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_shops_category_trgm ON shops USING GIN (category gin_trgm_ops)');

        // 3. Add Indexes for Products
        console.log('Creating indexes for products...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_category_trgm ON products USING GIN (category gin_trgm_ops)');

        console.log('Search Optimization Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateSearch();
