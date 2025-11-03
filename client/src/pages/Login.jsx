// nikhi-l37/local-inventory-project/local-inventory-project-311337e0354f330c870cbcf8e0b43f1dfb388258/client/src/pages/Login.jsx
import React, { useState } from 'react';
import api from '../api'; 
import { useNavigate, Link } from 'react-router-dom'; // ADDED Link
import Logo from '../components/Logo.jsx'; // <-- IMPORT LOGO

    
import styles from './Form.module.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
// ... (handleSubmit function remains the same)
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
    <div className={styles.formContainer}>
      
      {/* --- REPLACED with Finder Branding --- */}
      <div className={styles.logoWrapper}>
        <Logo simple={true} /> {/* Use the simple version of your logo */}
      </div>
      <h2>Seller Portal</h2> {/* Changed heading text */}
      <p className={styles.tagline}>Manage your screen time with secure authentication</p>

      {/* --- Tab Navigation (Sign In / Sign Up) --- */}
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
      {/* Optional: Add "Forgot password" link for authenticity */}
      <a href="#" style={{ display: 'block', marginTop: '15px', color: 'var(--primary-color)' }}>
        Forgot password?
      </a>
    </div>
  );
}

export default Login;