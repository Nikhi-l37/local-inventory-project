const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./middleware/auth'); // Import our auth middleware
const upload = require('./middleware/uploadMiddleware'); // Import upload middleware

// ROUTE: POST /api/shops
// PURPOSE: To create a new shop for a logged-in seller
// ACCESS: Private (requires token)
// ROUTE: POST /api/shops
// PURPOSE: To create a new shop for a logged-in seller (NOW WITH FULL ADDRESS)
// ACCESS: Private (requires token)
// ROUTE: POST /api/shops
// PURPOSE: To create a new shop for a logged-in seller (NOW WITH FULL ADDRESS & IMAGE & HOURS)
// ACCESS: Private (requires token)
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const {
      name,
      category,
      latitude,
      longitude,
      town_village,
      mandal,
      district,
      state,
      description,
      opening_time,
      closing_time
    } = req.body;

    // image file is available at req.file
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const sellerId = req.sellerId;
    const locationString = `POINT(${longitude} ${latitude})`;

    const newShop = await pool.query(
      `INSERT INTO shops (
         seller_id, name, category, location, 
         town_village, mandal, district, state,
         description, opening_time, closing_time, image_url
       ) 
       VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING 
         id, seller_id, name, category, is_open,
         ST_Y(location::geometry) AS latitude,
         ST_X(location::geometry) AS longitude,
         town_village, mandal, district, state,
         description, opening_time, closing_time, image_url
      `,
      [
        sellerId, name, category, locationString,
        town_village, mandal, district, state,
        description, opening_time, closing_time, image_url
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

    // --- FIX: JOIN sellers table to fetch the email address ---
    const shop = await pool.query(
      `SELECT 
         s.id, s.seller_id, s.name, s.category, s.is_open,
         s.town_village, s.mandal, s.district, s.state,
         s.description, s.opening_time, s.closing_time, s.image_url,
         ST_Y(s.location::geometry) AS latitude,
         ST_X(s.location::geometry) AS longitude,
         e.email AS seller_email 
       FROM shops s
       JOIN sellers e ON s.seller_id = e.id 
       WHERE s.seller_id = $1`,
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


router.patch('/update-details', [auth, upload.single('image')], async (req, res) => {
  try {
    const { name, category, description, opening_time, closing_time } = req.body;
    const sellerId = req.sellerId;

    let updateQuery;
    let queryParams;

    if (req.file) {
      // If a new image is uploaded, update image_url too
      const image_url = `/uploads/${req.file.filename}`;
      updateQuery = `
        UPDATE shops 
        SET name = $1, category = $2, description = $3, opening_time = $4, closing_time = $5, image_url = $6
        WHERE seller_id = $7
      `;
      queryParams = [name, category, description, opening_time, closing_time, image_url, sellerId];
    } else {
      // No new image, keep the old one (don't overwrite with null)
      updateQuery = `
        UPDATE shops 
        SET name = $1, category = $2, description = $3, opening_time = $4, closing_time = $5
        WHERE seller_id = $6
      `;
      queryParams = [name, category, description, opening_time, closing_time, sellerId];
    }

    // 1. Perform the update
    await pool.query(updateQuery, queryParams);

    // 2. Fetch the newly updated shop data
    const updatedShop = await pool.query(
      `SELECT 
         s.id, s.seller_id, s.name, s.category, s.is_open,
         s.town_village, s.mandal, s.district, s.state,
         s.description, s.opening_time, s.closing_time, s.image_url,
         ST_Y(s.location::geometry) AS latitude,
         ST_X(s.location::geometry) AS longitude,
         e.email AS seller_email 
       FROM shops s
       JOIN sellers e ON s.seller_id = e.id 
       WHERE s.seller_id = $1`,
      [sellerId]
    );

    if (updatedShop.rows.length === 0) {
      return res.status(404).json({ msg: 'Shop update failed or shop disappeared.' });
    }

    res.json(updatedShop.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE: PATCH /api/shops/update-location
// PURPOSE: Update shop location and address
// ACCESS: Private (Seller)
router.patch('/update-location', auth, async (req, res) => {
  try {
    const { latitude, longitude, town_village, mandal, district, state } = req.body;
    const sellerId = req.sellerId;
    const locationString = `POINT(${longitude} ${latitude})`;

    await pool.query(
      `UPDATE shops 
       SET location = ST_GeomFromText($1, 4326),
           town_village = $2, mandal = $3, district = $4, state = $5
       WHERE seller_id = $6`,
      [locationString, town_village, mandal, district, state, sellerId]
    );

    // Return updated shop
    const updatedShop = await pool.query(
      `SELECT 
         s.id, s.seller_id, s.name, s.category, s.is_open,
         s.town_village, s.mandal, s.district, s.state,
         s.description, s.opening_time, s.closing_time, s.image_url,
         ST_Y(s.location::geometry) AS latitude,
         ST_X(s.location::geometry) AS longitude,
         e.email AS seller_email 
       FROM shops s
       JOIN sellers e ON s.seller_id = e.id 
       WHERE s.seller_id = $1`,
      [sellerId]
    );
    res.json(updatedShop.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;