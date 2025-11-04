import React, { useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import styles from './Form.module.css';

function Register() {
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
      alert('Registration failed: ' + err.response.data);
    }
  };

  return (
    <>
      <div className={styles.formContainer}>
        <div className={styles.logoWrapper}>
          <Logo simple={true} />
        </div>
        <p className={styles.tagline}>Create an account to list your shop and products.</p>

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

      {/* --- THIS IS THE NEW "ABOUT" SECTION --- */}
      <div className={styles.aboutSection}>
        <h2>Why Join Finder?</h2>
        <p>
          Finder connects your local shop with thousands of customers in your area. Stop losing sales just because people don't know you have an item in stock.
        </p>
        <p>
          Our platform is free and simple. With just two clicks, you can set your shop as "OPEN" and mark your key products as "Available," letting everyone nearby find you instantly.
        </p>
      </div>
    </>
  );
}

export default Register;