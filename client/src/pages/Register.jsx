// nikhi-l37/local-inventory-project/local-inventory-project-311337e0354f330c870cbcf8e0b43f1dfb388258/client/src/pages/Register.jsx
import React, { useState } from 'react';
import api from '../api'; // CHANGED: Use API client for non-public routes
import { Link } from 'react-router-dom'; // ADDED Link
import Logo from '../components/Logo.jsx'; // <-- IMPORT LOGO
    
import styles from './Form.module.css';

function Register() {
// ... (state and handleSubmit function remain the same)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newUser = { email, password };
    try {
      const response = await api.post('/api/sellers/register', newUser);
      console.log('Registration successful! Token:', response.data.token);
      alert('Registration successful! You can now log in.');
    } catch (err) {
      console.error('Registration failed:', err.response.data);
      alert('Registration failed: ' + err.response.data); // Added alert to match login
    }
  };
      
  return (
    <div className={styles.formContainer}>
      
      {/* --- REPLACED with Finder Branding --- */}
      <div className={styles.logoWrapper}>
        <Logo simple={true} /> {/* Use the simple version of your logo */}
      </div>
      <h2>Seller Registration</h2> {/* Changed heading text */}
      <p className={styles.tagline}>Manage your screen time with secure authentication</p>

      {/* --- Tab Navigation (Sign In / Sign Up) --- */}
      <div className={styles.tabContainer}>
        <Link to="/login" className={styles.tabButton}>
          Sign In
        </Link>
        <button className={`${styles.tabButton} ${styles.active}`}>
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.formInput}
            placeholder="your@email.com"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.formInput}
            placeholder="••••••"
          />
        </div>
        <button type="submit" className={styles.formButton}>Sign Up</button>
      </form>
    </div>
  );
}

export default Register;