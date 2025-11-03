import React, { useState } from 'react';
import axios from 'axios';
    
// 1. This line IMPORTS the styles
import styles from './Form.module.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newUser = { email, password };
    try {
      const response = await axios.post('http://localhost:3001/api/sellers/register', newUser);
      console.log('Registration successful! Token:', response.data.token);
      alert('Registration successful! You can now log in.');
    } catch (err) {
      console.error('Registration failed:', err.response.data);
    }
  };
      
  // 2. This code APPLIES the styles with 'className'
  return (
    <div className={styles.formContainer}>
      <h2>Register as a Seller</h2>
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
        <button type="submit" className={styles.formButton}>Register</button>
      </form>
    </div>
  );
}

export default Register;