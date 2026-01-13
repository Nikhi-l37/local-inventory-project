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
    const user = { email: email.trim(), password: password.trim() };
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

      {/* --- Project Branding --- */}
      <div className={styles.logoWrapper}>
        <Logo simple={true} />
      </div>
      <p className={styles.tagline}>Access your inventory dashboard and manage your shop location.</p>

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
      <Link to="/forgot-password" style={{ display: 'block', marginTop: '15px' }} className={styles.formContainerLink}>
        Forgot password?
      </Link>
    </div>
  );
}

export default Login;