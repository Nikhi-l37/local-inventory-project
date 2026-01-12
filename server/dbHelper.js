// Database helper functions for better error handling with Supabase
const pool = require('./db');

/**
 * Execute a query with automatic retry logic for transient errors
 * @param {string} queryText - SQL query string
 * @param {Array} params - Query parameters
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @returns {Promise} Query result
 */
async function queryWithRetry(queryText, params = [], maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(queryText, params);
      return result;
    } catch (err) {
      lastError = err;
      
      // Check if error is retriable (connection issues, lock timeout, etc.)
      const isRetriable = 
        err.code === 'ECONNRESET' ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === '40001' || // Serialization failure
        err.code === '40P01' || // Deadlock detected
        err.code === '57P03'; // Cannot connect now
      
      if (!isRetriable || attempt === maxRetries) {
        throw err;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`Query failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Execute a query and handle common Supabase errors gracefully
 * @param {string} queryText - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
async function safeQuery(queryText, params = []) {
  try {
    return await queryWithRetry(queryText, params);
  } catch (err) {
    // Log detailed error for debugging
    console.error('Database query error:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    
    // Re-throw with more context
    throw err;
  }
}

module.exports = {
  query: safeQuery,
  queryWithRetry,
  pool
};
