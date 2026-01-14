const dns = require('dns');

// AGGRESSIVE FIX: Monkey-patch dns.lookup to force IPv4
// This is necessary because Render/Supabase sometimes fail with IPv6 (ENETUNREACH)
// and strict caching or result ordering might not be enough.
const originalLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  if (!options.family) {
    options.family = 4; // Force IPv4 if not specified
  }
  return originalLookup(hostname, options, callback);
};

const express = require('express');
const cors = require('cors'); // Import cors
const pool = require('./db'); // Import our db connection
const { initializeDatabase, checkDatabaseHealth } = require('./dbHealthCheck');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = 3001;
const host = '0.0.0.0';

// === MIDDLEWARE ===
app.use(cors()); // Allow requests (Cross-Origin)
app.use(express.json()); // Allow our server to read JSON body data

// Use 'uploads' directory for static files (images)
// access: http://localhost:3001/uploads/filename.jpg
app.use('/uploads', express.static('uploads'));

// === HEALTH CHECK ENDPOINT ===
app.get('/api/health', async (req, res) => {
  const health = await checkDatabaseHealth();
  if (health.healthy) {
    res.json({
      status: 'ok',
      database: health.details
    });
  } else {
    res.status(503).json({
      status: 'error',
      message: health.message,
      error: health.details
    });
  }
});

// === ROUTES ===
// Tell Express to use our auth.js file for any routes that start with /api/sellers
app.use('/api/sellers', require('./auth'));
app.use('/api/shops', require('./shop'));
app.use('/api/products', require('./product'));
app.use('/api/categories', require('./category'));
app.use('/api/search', require('./search'));

// === SERVE STATIC FILES (Production) ===
const path = require('path');
// Serve static files from the React client app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing, return all requests to React app
// (Exclude /api routes so they don't get caught here if missing)
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// === ERROR HANDLING ===
// Global error handler (must be last)
app.use(errorHandler);

// === START SERVER ===
async function startServer() {
  // Check database connection before starting server
  await initializeDatabase();

  app.listen(port, host, () => {
    console.log(`Server is running successfully on http://localhost:${port}`);
    console.log(`\nNetwork access is available. Use your laptop's IP address: http://<YOUR_IP>:${port}\n`);
    console.log(`Health check available at: http://localhost:${port}/api/health\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
