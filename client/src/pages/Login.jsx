import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
    
// 1. This line IMPORTS the styles
import styles from './Form.module.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = { email, password };
    try {
      const response = await axios.post('http://localhost:3001/api/sellers/login', user);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err.response.data);
      alert('Login Failed: ' + err.response.data);
    }
  };

  // 2. This code APPLIES the styles with 'className'
  return (
    <div className={styles.formContainer}>
      <h2>Seller Login</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.formInput}
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
          />
        </div>
        <button type="submit" className={styles.formButton}>Login</button>
      </form>
    </div>
  );
}

export default Login;