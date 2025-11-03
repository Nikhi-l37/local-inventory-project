const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./middleware/auth'); // Import our auth middleware

// ROUTE: POST /api/shops
// PURPOSE: To create a new shop for a logged-in seller
// ACCESS: Private (requires token)
// ROUTE: POST /api/shops
// PURPOSE: To create a new shop for a logged-in seller (NOW WITH FULL ADDRESS)
// ACCESS: Private (requires token)
// ROUTE: POST /api/shops
// PURPOSE: To create a new shop for a logged-in seller (NOW WITH FULL ADDRESS)
// ACCESS: Private (requires token)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      latitude, 
      longitude, 
      town_village, 
      mandal, 
      district, 
      state 
    } = req.body;
    
    const sellerId = req.sellerId;
    const locationString = `POINT(${longitude} ${latitude})`;

    // 4. THIS QUERY IS NOW FIXED!
    // It now RETURNINGs the same data as our GET route.
    const newShop = await pool.query(
      `INSERT INTO shops (
         seller_id, name, category, location, 
         town_village, mandal, district, state
       ) 
       VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5, $6, $7, $8) 
       RETURNING 
         id, seller_id, name, category, is_open,
         ST_Y(location::geometry) AS latitude,
         ST_X(location::geometry) AS longitude,
         town_village, mandal, district, state
      `,
      [
        sellerId, name, category, locationString, 
        town_village, mandal, district, state
      ]
    );

    res.json(newShop.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE: GET /api/shops/my-shop
// PURPOSE: To get the shop for the currently logged-in seller
// ACCESS: Private (requires token)
// ROUTE: GET /api/shops/my-shop
// PURPOSE: To get the shop for the currently logged-in seller
// ACCESS: Private (requires token)
// ROUTE: GET /api/shops/my-shop
// PURPOSE: To get the shop for the currently logged-in seller
// ACCESS: Private (requires token)
router.get('/my-shop', auth, async (req, res) => {
  try {
    const sellerId = req.sellerId;

    // UPDATED QUERY: Now selects all address fields
    const shop = await pool.query(
      `SELECT 
         id, seller_id, name, category, is_open,
         town_village, mandal, district, state,
         ST_Y(location::geometry) AS latitude,
         ST_X(location::geometry) AS longitude
       FROM shops 
       WHERE seller_id = $1`,
      [sellerId]
    );

    if (shop.rows.length === 0) {
      return res.status(404).json({ msg: 'Shop not found for this seller' });
    }

    res.json(shop.rows[0]);

  } catch (err) { 
    console.error(err.message);
    res.status(500).send('Server Error');
  } 
});

// ROUTE: PATCH /api/shops/status
// PURPOSE: To update the shop's 'is_open' status
// ACCESS: Private (requires token)
// ROUTE: PATCH /api/shops/status
// PURPOSE: To update the shop's 'is_open' status
// ACCESS: Private (requires token)
router.patch('/status', auth, async (req, res) => {
  try {
    const { is_open } = req.body; 
    const sellerId = req.sellerId;

    // UPDATED QUERY: We now update the shop and then
    // immediately return ALL of its data
    const updatedShop = await pool.query(
      `
      WITH updated AS (
        UPDATE shops 
        SET is_open = $1 
        WHERE seller_id = $2
        RETURNING *
      )
      SELECT 
        id, seller_id, name, category, is_open,
        town_village, mandal, district, state,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
      FROM updated
      `,
      [is_open, sellerId]
    );

    if (updatedShop.rows.length === 0) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    res.json(updatedShop.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE: GET /api/shops/my-shop/products
// PURPOSE: To get all products for the logged-in seller's shop
// ACCESS: Private (requires token)
router.get('/my-shop/products', auth, async (req, res) => {
  try {
    const sellerId = req.sellerId;

    // 1. Find the seller's shop ID
    const shop = await pool.query('SELECT id FROM shops WHERE seller_id = $1', [sellerId]);
    if (shop.rows.length === 0) {
      return res.status(404).json({ msg: 'Shop not found' });
    }
    const shopId = shop.rows[0].id;

    // 2. Get all products for that shop
    const products = await pool.query('SELECT * FROM products WHERE shop_id = $1 ORDER BY name', [
      shopId,
    ]);

    res.json(products.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;