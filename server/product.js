const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./middleware/auth'); // Our auth middleware
const upload = require('./middleware/uploadMiddleware'); // Import upload middleware

// ROUTE: POST /api/products
// PURPOSE: To add a new product to a seller's shop
// ACCESS: Private (requires token)
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { name, category, category_id, price, description } = req.body;
    const sellerId = req.sellerId;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // 1. Get the shopId for the currently logged-in seller securely
    const shopResult = await pool.query('SELECT id FROM shops WHERE seller_id = $1', [sellerId]);

    if (shopResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Seller does not have a registered shop.' });
    }
    const shopId = shopResult.rows[0].id;

    // If they own it, add the product
    // We handle both legacy 'category' string and new 'category_id'
    const newProduct = await pool.query(
      `INSERT INTO products (shop_id, name, category, category_id, price, description, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [shopId, name, category || 'Uncategorized', category_id || null, price, description, image_url]
    );

    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE: PATCH /api/products/:productId/details
// PURPOSE: To update product details (name, price, etc.)
// ACCESS: Private (requires token)
router.patch('/:productId/details', [auth, upload.single('image')], async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, category, category_id, price, description, is_available } = req.body;
    const sellerId = req.sellerId;

    // Security check
    const product = await pool.query(
      'SELECT p.id FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.id = $1 AND s.seller_id = $2',
      [productId, sellerId]
    );

    if (product.rows.length === 0) {
      return res.status(403).json({ msg: 'Authorization denied.' });
    }

    let updateQuery;
    let queryParams;

    if (req.file) {
      const image_url = `/uploads/${req.file.filename}`;
      updateQuery = `
        UPDATE products 
        SET name = $1, category = $2, category_id = $3, price = $4, description = $5, is_available = $6, image_url = $7, last_updated = NOW()
        WHERE id = $8
        RETURNING *
      `;
      queryParams = [name, category, category_id || null, price, description, is_available, image_url, productId];
    } else {
      updateQuery = `
        UPDATE products 
        SET name = $1, category = $2, category_id = $3, price = $4, description = $5, is_available = $6, last_updated = NOW()
        WHERE id = $7
        RETURNING *
      `;
      queryParams = [name, category, category_id || null, price, description, is_available, productId];
    }

    const updatedProduct = await pool.query(updateQuery, queryParams);
    res.json(updatedProduct.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// ROUTE: PATCH /api/products/:productId
// PURPOSE: To update a product's availability (Legacy/Simple Toggle)
// ACCESS: Private (requires token)
router.patch('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { is_available } = req.body; // The new status (true or false)
    const sellerId = req.sellerId;

    // This is a complex query to ensure the seller owns the product they're trying to edit.
    // It joins 'products' and 'shops' tables.
    const product = await pool.query(
      'SELECT p.id FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.id = $1 AND s.seller_id = $2',
      [productId, sellerId]
    );

    if (product.rows.length === 0) {
      return res.status(403).json({ msg: 'Authorization denied. You do not own this product.' });
    }

    // If they own it, update the product
    const updatedProduct = await pool.query(
      'UPDATE products SET is_available = $1, last_updated = NOW() WHERE id = $2 RETURNING *',
      [is_available, productId]
    );

    res.json(updatedProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// ROUTE: GET /api/products/shop/:shopId
// PURPOSE: To get all AVAILABLE products for a specific shop
// ACCESS: Public
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    // Find all products for this shop that are marked as 'is_available = true'
    // V3: Join with categories table to get refined category name if available
    const products = await pool.query(
      `SELECT 
         p.id, p.name, p.price, p.description, p.image_url, p.is_available, p.last_updated,
         p.category_id,
         COALESCE(c.name, p.category) as category 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.shop_id = $1 AND p.is_available = true 
       ORDER BY category, p.name`,
      [shopId]
    );

    res.json(products.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE: DELETE /api/products/:productId
// PURPOSE: To delete a product
// ACCESS: Private (requires token)
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.sellerId;

    // Security Check: Does this seller own the product they're trying to delete?
    const product = await pool.query(
      'SELECT p.id FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.id = $1 AND s.seller_id = $2',
      [productId, sellerId]
    );

    if (product.rows.length === 0) {
      return res.status(403).json({ msg: 'Authorization denied. You do not own this product.' });
    }

    // If they own it, delete the product
    await pool.query('DELETE FROM products WHERE id = $1', [productId]);

    res.json({ msg: 'Product deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;