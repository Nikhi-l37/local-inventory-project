const express = require('express');
const router = express.Router();
const pool = require('./db');

// ROUTE: GET /api/search (Product Search)
router.get('/', async (req, res) => {
  try {
    // 1. Get all params from the query
    const { q, lat, lon, open_only } = req.query;
    
    // --- FIX: Robust Validation Check ---
    // 1. Check for required search query
    if (!q) {
        return res.status(400).send('Search query (q) is required.');
    }
    // 2. Ensure coordinates are valid numeric values
    if (!lat || !lon || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
      return res.status(400).send('Invalid or missing location coordinates. Please refresh or select a location.');
    }
    // --- End of validation ---

    // Set search parameters
    const searchRadius = 10000; 
    const userLocation = `POINT(${lon} ${lat})`;

    // Build WHERE clauses
    const params = [userLocation, `%${q}%`, searchRadius];
    const whereClauses = [
      "p.is_available = true",
      "p.name ILIKE $2", // $2 is the product name
      "ST_DWithin(s.location, ST_GeomFromText($1, 4326)::geography, $3)" // $1 is location, $3 is radius
    ];

    // Add open_only filter
    if (open_only === 'true') {
      whereClauses.push("s.is_open = true");
    }

    // Construct the final query string
    const queryString = `
      SELECT
        s.id AS shop_id, s.name AS shop_name, s.is_open,
        p.name AS product_name, p.last_updated,
        ST_Distance(s.location, ST_GeomFromText($1, 4326)::geography) AS distance_meters,
        ST_Y(s.location::geometry) AS latitude,
        ST_X(s.location::geometry) AS longitude
      FROM products p
      JOIN shops s ON p.shop_id = s.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY distance_meters;
    `;

    // Execute the query
    const results = await pool.query(queryString, params);

    res.json(results.rows);

  } catch (err) {
    console.error('Server Search Error:', err.message); // Log full error details
    res.status(500).send('Server Error during search query.');
  }
});

// ROUTE: GET /api/search/shops (Shop Search)
router.get('/shops', async (req, res) => {
  try {
    const { q, lat, lon, open_only } = req.query;
    
    // --- FIX: Robust Validation Check ---
    if (!q) {
        return res.status(400).send('Search query (q) is required.');
    }
    if (!lat || !lon || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
      return res.status(400).send('Invalid or missing location coordinates. Please refresh or select a location.');
    }
    // --- End of validation ---
    
    const searchRadius = 10000; 
    const userLocation = `POINT(${lon} ${lat})`;

    // Build WHERE clauses
    const params = [userLocation, `%${q}%`, searchRadius];
    const whereClauses = [
      "name ILIKE $2", 
      "ST_DWithin(location, ST_GeomFromText($1, 4326)::geography, $3)"
    ];

    // Add open_only filter
    if (open_only === 'true') {
      whereClauses.push("is_open = true");
    }

    // Construct the final query
    const queryString = `
      SELECT
        id, name, category, is_open,
        ST_Distance(location, ST_GeomFromText($1, 4326)::geography) AS distance_meters,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
      FROM shops
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY distance_meters;
    `;

    // Execute the query
    const results = await pool.query(queryString, params);

    res.json(results.rows);

  } catch (err) {
    console.error('Server Shop Search Error:', err.message); // Log full error details
    res.status(500).send('Server Error during shop search query.');
  }
});

module.exports = router;