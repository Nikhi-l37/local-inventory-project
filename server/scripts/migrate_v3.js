const path = require('path');
// Load .env explicitly from server root
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting V3 Migration...');

        // Log connection details (sanitized)
        console.log(`Connecting to DB: ${process.env.DATABASE_NAME} as ${process.env.DATABASE_USER}`);

        await client.query('BEGIN');

        // 1. Create Categories Table
        console.log('Creating categories table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        image_url VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 2. Add category_id to products table
        console.log('Checking products table schema...');

        // Check if column exists first to avoid errors on re-run
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' AND column_name='category_id';
    `);

        if (res.rows.length === 0) {
            console.log('Adding category_id column to products...');
            await client.query(`
        ALTER TABLE products 
        ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
      `);
            console.log('Added category_id column to products.');
        } else {
            console.log('category_id column already exists.');
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
