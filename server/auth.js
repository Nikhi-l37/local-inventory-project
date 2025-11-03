// This file will handle all /api/sellers routes (register, login)
const express = require('express');
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For creating tokens
const pool = require('./db'); // Our database connection

const router = express.Router(); // Create an Express router

// ROUTE: POST /api/sellers/register
// PURPOSE: To register a new seller
router.post('/register', async (req, res) => {
  try {
    // 1. Get the email and password from the request body
    const { email, password } = req.body;

    // 2. Check if the user already exists
    const user = await pool.query('SELECT * FROM sellers WHERE email = $1', [email]);
    if (user.rows.length > 0) {
      return res.status(401).send('Seller already exists.');
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Save the new seller to the database
    const newSeller = await pool.query(
      'INSERT INTO sellers (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );

    // 5. Create a JWT token
    // (We'll store the seller's ID in the token)
    const token = jwt.sign(
      { sellerId: newSeller.rows[0].id },
      process.env.JWT_SECRET // FIXED: Use ENV variable
    );

    // 6. Send the token back to the user
    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// ROUTE: POST /api/sellers/login
// PURPOSE: To log in an existing seller
router.post('/login', async (req, res) => {
  try {
    // 1. Get the email and password from the request body
    const { email, password } = req.body;

    // 2. Check if the seller exists in the database
    const user = await pool.query('SELECT * FROM sellers WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      // We send a generic error for security (don't want to say "user not found")
      return res.status(401).send('Invalid credentials.');
    }

    // 3. Check if the password is correct
    // We use bcrypt.compare to check the plain-text password against the hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).send('Invalid credentials.');
    }

    // 4. If email and password are correct, create a new JWT token
    const token = jwt.sign(
      { sellerId: user.rows[0].id },
      process.env.JWT_SECRET // FIXED: Use ENV variable
    );

    // 5. Send the new token back
    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; // Export the router