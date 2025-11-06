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
    <div className={styles.formContainer}>
      
      {/* --- Project Branding --- */}
      <div className={styles.logoWrapper}>
        <Logo simple={true} />
      </div>
      <p className={styles.tagline}>Join the Finder network to list your local products.</p>

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