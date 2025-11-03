// This file will connect us to our database

// 1. Import the 'pg' (node-postgres) library
const { Pool } = require('pg');

// 2. Load our environment variables from .env
require('dotenv').config();

// 3. Create a new connection "pool"
// This will use the environment variables we set in .env
// (user, host, database, password, port)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'local_inventory',
  password: process.env.DATABASE_PASSWORD,
  port: 5432, // This is the default port for PostgreSQL
});

// 4. Export the pool so we can use it in other files
module.exports = pool;