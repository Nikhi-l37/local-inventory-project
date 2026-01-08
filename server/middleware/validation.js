// Validation middleware for input sanitization and validation

/**
 * Validates email format
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password strength
 * Minimum 6 characters
 */
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
};

/**
 * Validates string field (not empty, proper type)
 */
const isValidString = (str, minLength = 1, maxLength = 500) => {
  if (str === null || str === undefined || typeof str !== 'string') return false;
  const trimmed = str.trim();
  // Allow empty strings only if minLength is 0
  if (minLength === 0 && trimmed.length === 0) return true;
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

/**
 * Validates numeric value
 */
const isValidNumber = (num, min = -Infinity, max = Infinity) => {
  if (num === null || num === undefined) return false;
  const parsed = parseFloat(num);
  return !isNaN(parsed) && parsed >= min && parsed <= max;
};

/**
 * Validates latitude (-90 to 90)
 */
const isValidLatitude = (lat) => {
  return isValidNumber(lat, -90, 90);
};

/**
 * Validates longitude (-180 to 180)
 */
const isValidLongitude = (lon) => {
  return isValidNumber(lon, -180, 180);
};

/**
 * Validates time format (HH:MM or HH:MM:SS)
 */
const isValidTime = (time) => {
  if (!time || typeof time !== 'string') return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(time);
};

/**
 * Validates boolean value
 */
const isValidBoolean = (val) => {
  return val === true || val === false || val === 'true' || val === 'false';
};

/**
 * Middleware: Validate registration input
 */
const validateRegister = (req, res, next) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required.' });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ msg: 'Please provide a valid email address.' });
  }

  // Validate password strength
  if (!isValidPassword(password)) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
  }

  next();
};

/**
 * Middleware: Validate login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required.' });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ msg: 'Please provide a valid email address.' });
  }

  next();
};

/**
 * Middleware: Validate forgot password input
 */
const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: 'Email is required.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ msg: 'Please provide a valid email address.' });
  }

  next();
};

/**
 * Middleware: Validate reset password input
 */
const validateResetPassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ msg: 'Password is required.' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
  }

  next();
};

/**
 * Middleware: Validate shop creation input
 */
const validateCreateShop = (req, res, next) => {
  const {
    name,
    category,
    latitude,
    longitude,
    town_village,
    mandal,
    district,
    state,
    opening_time,
    closing_time
  } = req.body;

  // Required fields
  if (!name || !category || latitude === undefined || latitude === null || longitude === undefined || longitude === null || !town_village || !mandal || !district || !state) {
    return res.status(400).json({ msg: 'All required fields must be provided (name, category, location, address).' });
  }

  // Validate strings
  if (!isValidString(name, 1, 200)) {
    return res.status(400).json({ msg: 'Shop name must be between 1 and 200 characters.' });
  }

  if (!isValidString(category, 1, 100)) {
    return res.status(400).json({ msg: 'Category must be between 1 and 100 characters.' });
  }

  if (!isValidString(town_village, 1, 100)) {
    return res.status(400).json({ msg: 'Town/Village must be between 1 and 100 characters.' });
  }

  if (!isValidString(mandal, 1, 100)) {
    return res.status(400).json({ msg: 'Mandal must be between 1 and 100 characters.' });
  }

  if (!isValidString(district, 1, 100)) {
    return res.status(400).json({ msg: 'District must be between 1 and 100 characters.' });
  }

  if (!isValidString(state, 1, 100)) {
    return res.status(400).json({ msg: 'State must be between 1 and 100 characters.' });
  }

  // Validate coordinates
  if (!isValidLatitude(latitude)) {
    return res.status(400).json({ msg: 'Invalid latitude. Must be between -90 and 90.' });
  }

  if (!isValidLongitude(longitude)) {
    return res.status(400).json({ msg: 'Invalid longitude. Must be between -180 and 180.' });
  }

  // Validate optional description
  const { description } = req.body;
  if (description !== undefined && description !== null && !isValidString(description, 0, 1000)) {
    return res.status(400).json({ msg: 'Description must be less than 1000 characters.' });
  }

  // Validate optional time fields
  if (opening_time && !isValidTime(opening_time)) {
    return res.status(400).json({ msg: 'Invalid opening time format. Use HH:MM.' });
  }

  if (closing_time && !isValidTime(closing_time)) {
    return res.status(400).json({ msg: 'Invalid closing time format. Use HH:MM.' });
  }

  next();
};

/**
 * Middleware: Validate shop update details
 */
const validateUpdateShopDetails = (req, res, next) => {
  const { name, category, opening_time, closing_time, description } = req.body;

  // At least one field should be present
  if (name === undefined && category === undefined && opening_time === undefined && closing_time === undefined && description === undefined) {
    return res.status(400).json({ msg: 'At least one field must be provided for update.' });
  }

  // Validate strings if provided
  if (name !== undefined && name !== null && !isValidString(name, 1, 200)) {
    return res.status(400).json({ msg: 'Shop name must be between 1 and 200 characters.' });
  }

  if (category !== undefined && category !== null && !isValidString(category, 1, 100)) {
    return res.status(400).json({ msg: 'Category must be between 1 and 100 characters.' });
  }

  if (description !== undefined && description !== null && !isValidString(description, 0, 1000)) {
    return res.status(400).json({ msg: 'Description must be less than 1000 characters.' });
  }

  // Validate time fields if provided
  if (opening_time !== undefined && opening_time !== null && !isValidTime(opening_time)) {
    return res.status(400).json({ msg: 'Invalid opening time format. Use HH:MM.' });
  }

  if (closing_time !== undefined && closing_time !== null && !isValidTime(closing_time)) {
    return res.status(400).json({ msg: 'Invalid closing time format. Use HH:MM.' });
  }

  next();
};

/**
 * Middleware: Validate shop location update
 */
const validateUpdateShopLocation = (req, res, next) => {
  const { latitude, longitude, town_village, mandal, district, state } = req.body;

  // All fields required for location update
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null || !town_village || !mandal || !district || !state) {
    return res.status(400).json({ msg: 'All location fields are required.' });
  }

  // Validate coordinates
  if (!isValidLatitude(latitude)) {
    return res.status(400).json({ msg: 'Invalid latitude. Must be between -90 and 90.' });
  }

  if (!isValidLongitude(longitude)) {
    return res.status(400).json({ msg: 'Invalid longitude. Must be between -180 and 180.' });
  }

  // Validate address fields
  if (!isValidString(town_village, 1, 100)) {
    return res.status(400).json({ msg: 'Town/Village must be between 1 and 100 characters.' });
  }

  if (!isValidString(mandal, 1, 100)) {
    return res.status(400).json({ msg: 'Mandal must be between 1 and 100 characters.' });
  }

  if (!isValidString(district, 1, 100)) {
    return res.status(400).json({ msg: 'District must be between 1 and 100 characters.' });
  }

  if (!isValidString(state, 1, 100)) {
    return res.status(400).json({ msg: 'State must be between 1 and 100 characters.' });
  }

  next();
};

/**
 * Middleware: Validate shop status update
 */
const validateUpdateShopStatus = (req, res, next) => {
  const { is_open } = req.body;

  if (is_open === undefined || is_open === null) {
    return res.status(400).json({ msg: 'Shop status (is_open) is required.' });
  }

  if (!isValidBoolean(is_open)) {
    return res.status(400).json({ msg: 'Shop status must be a boolean value.' });
  }

  next();
};

/**
 * Middleware: Validate product creation
 */
const validateCreateProduct = (req, res, next) => {
  const { name, price, category, description, category_id } = req.body;

  // Required fields
  if (!name || price === undefined || price === null) {
    return res.status(400).json({ msg: 'Product name and price are required.' });
  }

  // Validate product name
  if (!isValidString(name, 1, 200)) {
    return res.status(400).json({ msg: 'Product name must be between 1 and 200 characters.' });
  }

  // Validate price
  if (!isValidNumber(price, 0, 999999999)) {
    return res.status(400).json({ msg: 'Price must be a valid positive number.' });
  }

  // Validate optional fields
  if (category && !isValidString(category, 1, 100)) {
    return res.status(400).json({ msg: 'Category must be between 1 and 100 characters.' });
  }

  if (description !== undefined && description !== null && !isValidString(description, 0, 1000)) {
    return res.status(400).json({ msg: 'Description must be less than 1000 characters.' });
  }

  if (category_id !== undefined && !isValidNumber(category_id, 1)) {
    return res.status(400).json({ msg: 'Invalid category ID.' });
  }

  next();
};

/**
 * Middleware: Validate product update
 */
const validateUpdateProduct = (req, res, next) => {
  const { name, price, is_available, category, description, category_id } = req.body;

  // At least one field should be provided
  if (name === undefined && price === undefined && is_available === undefined && category === undefined && description === undefined && category_id === undefined) {
    return res.status(400).json({ msg: 'At least one field must be provided for update.' });
  }

  // Validate fields if provided
  if (name !== undefined && name !== null && !isValidString(name, 1, 200)) {
    return res.status(400).json({ msg: 'Product name must be between 1 and 200 characters.' });
  }

  if (price !== undefined && !isValidNumber(price, 0, 999999999)) {
    return res.status(400).json({ msg: 'Price must be a valid positive number.' });
  }

  if (is_available !== undefined && !isValidBoolean(is_available)) {
    return res.status(400).json({ msg: 'Availability must be a boolean value.' });
  }

  if (category !== undefined && category !== null && !isValidString(category, 1, 100)) {
    return res.status(400).json({ msg: 'Category must be between 1 and 100 characters.' });
  }

  if (description !== undefined && description !== null && !isValidString(description, 0, 1000)) {
    return res.status(400).json({ msg: 'Description must be less than 1000 characters.' });
  }

  if (category_id !== undefined && !isValidNumber(category_id, 1)) {
    return res.status(400).json({ msg: 'Invalid category ID.' });
  }

  next();
};

/**
 * Middleware: Validate product availability toggle
 */
const validateToggleProductAvailability = (req, res, next) => {
  const { is_available } = req.body;

  if (is_available === undefined || is_available === null) {
    return res.status(400).json({ msg: 'Product availability status is required.' });
  }

  if (!isValidBoolean(is_available)) {
    return res.status(400).json({ msg: 'Availability must be a boolean value.' });
  }

  next();
};

/**
 * Middleware: Validate category creation
 */
const validateCreateCategory = (req, res, next) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ msg: 'Category name is required.' });
  }

  if (!isValidString(name, 1, 100)) {
    return res.status(400).json({ msg: 'Category name must be between 1 and 100 characters.' });
  }

  if (description !== undefined && description !== null && !isValidString(description, 0, 500)) {
    return res.status(400).json({ msg: 'Description must be less than 500 characters.' });
  }

  next();
};

/**
 * Middleware: Validate ID parameter
 */
const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !isValidNumber(id, 1)) {
      return res.status(400).json({ msg: `Invalid ${paramName}. Must be a positive number.` });
    }
    
    next();
  };
};

module.exports = {
  // Validation functions
  isValidEmail,
  isValidPassword,
  isValidString,
  isValidNumber,
  isValidLatitude,
  isValidLongitude,
  isValidTime,
  isValidBoolean,
  
  // Middleware validators
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateCreateShop,
  validateUpdateShopDetails,
  validateUpdateShopLocation,
  validateUpdateShopStatus,
  validateCreateProduct,
  validateUpdateProduct,
  validateToggleProductAvailability,
  validateCreateCategory,
  validateIdParam
};
