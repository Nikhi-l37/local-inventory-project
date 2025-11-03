const express = require('express');
const router = express.Router();
const pool = require('./db');

// ROUTE: GET /api/search (Now updated for 'open_only' filter)
router.get('/', async (req, res) => {
  try {
    // 1. Get all params from the query (new one is 'open_only')
    const { q, lat, lon, open_only } = req.query;
    
    // We can set a larger radius now, e.g., 10000m = 10km
    const searchRadius = 10000; 
    const userLocation = `POINT(${lon} ${lat})`;

    // 2. Build our query dynamically and safely
    const params = [userLocation, `%${q}%`, searchRadius];
    const whereClauses = [
      "p.is_available = true",
      "p.name ILIKE $2", // $2 is the product name
      "ST_DWithin(s.location, ST_GeomFromText($1, 4326)::geography, $3)" // $1 is location, $3 is radius
    ];

    // 3. THIS IS THE NEW LOGIC!
    // If open_only is 'true', we add another condition to the query
    if (open_only === 'true') {
      whereClauses.push("s.is_open = true");
    }

    // 4. Construct the final query string
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

    // 5. Execute the query
    const results = await pool.query(queryString, params);

    res.json(results.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// We will add the '/shops' route here in the next step

// ROUTE: GET /api/search/shops
// PURPOSE: To find shops by name near a user
router.get('/shops', async (req, res) => {
  try {
    // 1. Get params (same as before)
    const { q, lat, lon, open_only } = req.query;
    
    // 10km radius for shops
    const searchRadius = 10000; 
    const userLocation = `POINT(${lon} ${lat})`;

    // 2. Build our query dynamically
    const params = [userLocation, `%${q}%`, searchRadius];
    const whereClauses = [
      "name ILIKE $2", // $2 is the shop name
      "ST_DWithin(location, ST_GeomFromText($1, 4326)::geography, $3)" // $1 is location, $3 is radius
    ];

    // 3. Add the 'open_only' filter if it's 'true'
    if (open_only === 'true') {
      whereClauses.push("is_open = true");
    }

    // 4. Construct the final query
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

    // 5. Execute the query
    const results = await pool.query(queryString, params);

    res.json(results.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;