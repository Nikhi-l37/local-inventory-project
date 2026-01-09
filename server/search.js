const express = require('express');
const router = express.Router();
const pool = require('./db');

// ROUTE: GET /api/search (Product Search)
router.get('/', async (req, res) => {
  try {
    // 1. Get all params from the query
    const { q, lat, lon, open_only, range } = req.query;

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

    // Set search parameters with custom range support
    // Convert km to meters (range comes in km from frontend)
    const customRange = range ? parseFloat(range) * 1000 : 5000;
    const searchRadius = Math.min(Math.max(customRange, 500), 100000); // Min 0.5km, Max 100km
    const userLocation = `POINT(${lon} ${lat})`;

    console.log(`[Search Debug] Query: "${q}", Location: ${userLocation}, OpenOnly: ${open_only}, Range: ${searchRadius}m`);

    // Build WHERE clauses with fuzzy matching
    // $1 = userLocation, $2 = raw query (for similarity), $3 = searchRadius, $4 = %query% (for ILIKE fallback)
    const params = [userLocation, q, searchRadius, `%${q}%`];
    const whereClauses = [
      "p.is_available = true",
      "(similarity(p.name, $2) > 0.1 OR p.name ILIKE $4)", // Fuzzy match OR exact substring
      "ST_DWithin(s.location, ST_GeomFromText($1, 4326)::geography, $3)"
    ];

    // Add open_only filter (SMART TIME LOGIC)
    if (open_only === 'true') {
      whereClauses.push("s.is_open = true");
      whereClauses.push("CURRENT_TIME BETWEEN s.opening_time AND s.closing_time");
    }

    // Construct the final query string with similarity score for ordering
    const queryString = `
      SELECT
        s.id AS shop_id, s.name AS shop_name, s.is_open, s.opening_time, s.closing_time, s.image_url AS shop_image,
        p.name AS product_name, p.category, p.price, p.description, p.image_url AS product_image, p.last_updated,
        ST_Distance(s.location, ST_GeomFromText($1, 4326)::geography) AS distance_meters,
        ST_Y(s.location::geometry) AS latitude,
        ST_X(s.location::geometry) AS longitude,
        similarity(p.name, $2) AS match_score
      FROM products p
      JOIN shops s ON p.shop_id = s.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY match_score DESC, distance_meters ASC;
    `;

    // Execute the query
    const results = await pool.query(queryString, params);

    console.log(`[Search Debug] Found ${results.rows.length} results.`);

    res.json(results.rows);

  } catch (err) {
    console.error('Server Search Error:', err.message);
    res.status(500).send('Server Error during search query.');
  }
});

// ROUTE: GET /api/search/shops (Shop Search)
router.get('/shops', async (req, res) => {
  try {
    const { q, lat, lon, open_only, range } = req.query;

    // --- FIX: Robust Validation Check ---
    if (!q) {
      return res.status(400).send('Search query (q) is required.');
    }
    if (!lat || !lon || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
      return res.status(400).send('Invalid or missing location coordinates. Please refresh or select a location.');
    }
    // --- End of validation ---

    // Set search parameters with custom range support
    // Convert km to meters (range comes in km from frontend)
    const customRange = range ? parseFloat(range) * 1000 : 5000;
    const searchRadius = Math.min(Math.max(customRange, 500), 100000); // Min 0.5km, Max 100km
    const userLocation = `POINT(${lon} ${lat})`;

    console.log(`[Search Shops Debug] Query: "${q}", Location: ${userLocation}, OpenOnly: ${open_only}, Range: ${searchRadius}m`);

    // Build WHERE clauses with fuzzy matching
    // $1 = userLocation, $2 = raw query (for similarity), $3 = searchRadius, $4 = %query% (for ILIKE fallback)
    const params = [userLocation, q, searchRadius, `%${q}%`];

    // Fuzzy search by shop name OR category
    const whereClauses = [
      "(similarity(name, $2) > 0.1 OR similarity(category, $2) > 0.1 OR name ILIKE $4 OR category ILIKE $4)",
      "ST_DWithin(location, ST_GeomFromText($1, 4326)::geography, $3)"
    ];

    // Add open_only filter (SMART TIME LOGIC)
    if (open_only === 'true') {
      whereClauses.push("is_open = true");
      whereClauses.push("CURRENT_TIME BETWEEN opening_time AND closing_time");
    }

    // Construct the final query with similarity score for ordering
    const queryString = `
      SELECT
        id, name, category, is_open, opening_time, closing_time, image_url, description,
        ST_Distance(location, ST_GeomFromText($1, 4326)::geography) AS distance_meters,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude,
        GREATEST(similarity(name, $2), similarity(category, $2)) AS match_score
      FROM shops
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY match_score DESC, distance_meters ASC;
    `;

    // Execute the query
    const results = await pool.query(queryString, params);

    console.log(`[Search Shops Debug] Found ${results.rows.length} results.`);

    res.json(results.rows);

  } catch (err) {
    console.error('Server Shop Search Error:', err.message);
    res.status(500).send('Server Error during shop search query.');
  }
});

module.exports = router;