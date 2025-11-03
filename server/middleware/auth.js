const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Get the token from the request header
  const token = req.header('x-auth-token');

  // 2. Check if no token was sent
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // FIXED: Use ENV variable
    
    // 4. Add the seller's ID from the token to the request object
    req.sellerId = decoded.sellerId;
    
    // 5. Call 'next()' to move on to the actual route
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};