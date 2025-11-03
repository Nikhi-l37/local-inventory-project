// nikhi-l37/local-inventory-project/local-inventory-project-311337e0354f330c870cbcf8e0b43f1dfb388258/server/db.js
const { Pool } = require('pg');

// 2. Load our environment variables from .env
require('dotenv').config();

// 3. Create a new connection "pool"
// This will use the environment variables we set in .env
// (user, host, database, password, port)
const pool = new Pool({
  user: process.env.DATABASE_USER || 'postgres', // <--- CHANGED
  host: process.env.DATABASE_HOST || 'localhost', // <--- CHANGED
  database: process.env.DATABASE_NAME || 'local_inventory', // <--- CHANGED
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT || 5432, // <--- CHANGED
});

// 4. Export the pool so we can use it in other files
module.exports = pool;


