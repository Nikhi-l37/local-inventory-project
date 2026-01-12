// Database connection health check
const pool = require('./db');

/**
 * Check if database connection is healthy
 * @returns {Promise<{healthy: boolean, message: string, details?: any}>}
 */
async function checkDatabaseHealth() {
  try {
    // Test basic connectivity
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    // Check PostGIS extension
    let postgisAvailable = false;
    try {
      await pool.query('SELECT PostGIS_version()');
      postgisAvailable = true;
    } catch (err) {
      console.warn('PostGIS extension not available:', err.message);
    }
    
    // Check pg_trgm extension
    let pgtrgmAvailable = false;
    try {
      await pool.query("SELECT similarity('test', 'test')");
      pgtrgmAvailable = true;
    } catch (err) {
      console.warn('pg_trgm extension not available:', err.message);
    }
    
    return {
      healthy: true,
      message: 'Database connection successful',
      details: {
        timestamp: result.rows[0].current_time,
        version: result.rows[0].db_version,
        postgis: postgisAvailable,
        pg_trgm: pgtrgmAvailable
      }
    };
  } catch (err) {
    return {
      healthy: false,
      message: 'Database connection failed',
      details: {
        error: err.message,
        code: err.code
      }
    };
  }
}

/**
 * Initialize database and check critical requirements
 * Logs warnings but doesn't crash the app
 */
async function initializeDatabase() {
  console.log('\n=== Database Connection Check ===');
  
  const health = await checkDatabaseHealth();
  
  if (health.healthy) {
    console.log('✓ Database connected successfully');
    console.log(`  Version: ${health.details.version}`);
    console.log(`  PostGIS: ${health.details.postgis ? '✓' : '✗ (NOT AVAILABLE - Location features may not work)'}`);
    console.log(`  pg_trgm: ${health.details.pg_trgm ? '✓' : '✗ (NOT AVAILABLE - Search features may not work)'}`);
    
    if (!health.details.postgis) {
      console.warn('\n⚠ WARNING: PostGIS extension is not enabled!');
      console.warn('  Enable it in Supabase: Database > Extensions > postgis');
    }
    
    if (!health.details.pg_trgm) {
      console.warn('\n⚠ WARNING: pg_trgm extension is not enabled!');
      console.warn('  Enable it in Supabase: Database > Extensions > pg_trgm');
    }
  } else {
    console.error('✗ Database connection failed');
    console.error(`  Error: ${health.details.error}`);
    console.error(`  Code: ${health.details.code}`);
    console.error('\nPlease check your .env file and ensure:');
    console.error('  1. Database credentials are correct');
    console.error('  2. Supabase project is active (not paused)');
    console.error('  3. Network connection is working');
  }
  
  console.log('================================\n');
  
  return health;
}

module.exports = {
  checkDatabaseHealth,
  initializeDatabase
};
