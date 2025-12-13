const express = require('express');
const cors = require('cors'); // Import cors
const pool = require('./db'); // Import our db connection

const app = express();
const port = 3001;
const host = '0.0.0.0';
// === MIDDLEWARE ===
app.use(cors()); // Allow requests from our frontend
app.use(express.json()); // Allow our server to read JSON body data

// === ROUTES ===
// Tell Express to use our auth.js file for any routes that start with /api/sellers
app.use('/api/sellers', require('./auth'));
app.use('/api/shops', require('./shop'));
app.use('/api/products', require('./product'));
app.use('/api/search', require('./search'));


// === START SERVER ===
app.listen(port, host, () => { 
  console.log(`Server is running successfully on http://localhost:${port}`);
  console.log(`\nNetwork access is available. Use your laptop's IP address: http://<YOUR_IP>:${port}\n`);
});
