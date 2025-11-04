import React, { useState } from 'react';
import api from '../api'; 
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import styles from './Form.module.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = { email, password };
    try {
      const response = await api.post('/api/sellers/login', user);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err.response.data);
      alert('Login Failed: ' + err.response.data);
    }
  };

  return (
    <>
      <div className={styles.formContainer}>
        <div className={styles.logoWrapper}>
          <Logo simple={true} />
        </div>
        <p className={styles.tagline}>Access your shop dashboard to manage products.</p>

        <div className={styles.tabContainer}>
          <button className={`${styles.tabButton} ${styles.active}`}>
            Sign In
          </button>
          <Link to="/register" className={styles.tabButton}>
            Sign Up
          </Link>
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
          <button type="submit" className={styles.formButton}>Sign In</button>
        </form>
        <a href="#" style={{ display: 'block', marginTop: '15px', color: 'var(--primary-color)' }}>
          Forgot password?
        </a>
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

export default Login;