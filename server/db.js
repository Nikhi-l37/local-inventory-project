// nikhi-l37/local-inventory-project/local-inventory-project-311337e0354f330c870cbcf8e0b43f1dfb388258/server/db.js
const { Pool } = require('pg');

// 2. Load our environment variables from .env
require('dotenv').config();

// Determine if we're connecting to Supabase
const isSupabase = process.env.DATABASE_HOST && process.env.DATABASE_HOST.includes('supabase.co');

// 3. Create a new connection "pool"
// This will use the environment variables we set in .env
// (user, host, database, password, port)
// Updated for Supabase with SSL and optimized pooler settings
const poolConfig = {
  user: process.env.DATABASE_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'local_inventory',
  password: process.env.DATABASE_PASSWORD,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  // Supabase requires SSL in production
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
};

// Add connection pooler settings for better performance and reliability
if (isSupabase) {
  // Supabase-specific connection pooler settings
  poolConfig.max = 10; // Reduced max connections for Supabase pooler
  poolConfig.idleTimeoutMillis = 20000; // Close idle clients after 20 seconds
  poolConfig.connectionTimeoutMillis = 10000; // Return error after 10 seconds if connection fails
  poolConfig.allowExitOnIdle = true; // Allow pool to exit when all clients are idle
} else {
  // Local PostgreSQL settings
  poolConfig.max = 20;
  poolConfig.idleTimeoutMillis = 30000;
  poolConfig.connectionTimeoutMillis = 10000;
}

const pool = new Pool(poolConfig);

// Handle pool errors gracefully
pool.on('error', (err, client) => {
  console.error('Unexpected database error on idle client:', err.message);
  // Don't crash the application on connection errors
});

// Add connection event for debugging
pool.on('connect', (client) => {
  console.log('New database connection established');
});

// Add remove event for debugging
pool.on('remove', (client) => {
  console.log('Database connection removed from pool');
});

module.exports = pool;


