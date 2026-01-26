// nikhi-l37/local-inventory-project/local-inventory-project-311337e0354f330c870cbcf8e0b43f1dfb388258/server/db.js
const { Pool } = require('pg');

// 2. Load our environment variables from .env
require('dotenv').config();

// Determine if we're connecting to Supabase
const isSupabase = process.env.DATABASE_HOST && process.env.DATABASE_HOST.includes('supabase.co');

// Check if SSL should be enabled (default true for Supabase, can be controlled via env)
const sslEnabled = process.env.DATABASE_SSL === 'true' || (process.env.DATABASE_SSL !== 'false' && isSupabase);

// 3. Create a new connection "pool"
// This will use the environment variables we set in .env
// (user, host, database, password, port)
// Updated for Supabase with SSL and optimized connection settings
const poolConfig = {
  user: process.env.DATABASE_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'local_inventory',
  password: process.env.DATABASE_PASSWORD,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  // SSL configuration - required for Supabase direct connections
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
};

// Add connection pooler settings for better performance and reliability
if (isSupabase) {
  // Supabase-specific connection settings (optimized for direct connection)
  poolConfig.max = 10; // Reduced max connections for Supabase
  poolConfig.idleTimeoutMillis = 20000; // Close idle clients after 20 seconds
  poolConfig.connectionTimeoutMillis = 15000; // Increased timeout for Render
  poolConfig.allowExitOnIdle = true; // Allow pool to exit when all clients are idle
} else {
  // Local PostgreSQL settings
  poolConfig.max = 20;
  poolConfig.idleTimeoutMillis = 30000;
  poolConfig.connectionTimeoutMillis = 10000;
}

console.log('Database Config:');
console.log('  Host:', poolConfig.host);
console.log('  Port:', poolConfig.port);
console.log('  Database:', poolConfig.database);
console.log('  SSL Enabled:', !!poolConfig.ssl);
const pool = new Pool(poolConfig);

// Handle pool errors gracefully
pool.on('error', (err, client) => {
  // Use console.error for error logging - consider using a logging library in production
  console.error('Unexpected database error on idle client:', err);
  // Don't crash the application on connection errors
});

// Add connection event for debugging
pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('New database connection established');
  }
});

// Add remove event for debugging
pool.on('remove', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Database connection removed from pool');
  }
});

module.exports = pool;


