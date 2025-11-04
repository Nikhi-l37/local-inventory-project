import React, { useState } from 'react';
import api from '../api'; // Use our api helper
import { Link } from 'react-router-dom';
import styles from './Form.module.css'; // We can reuse our form styles!
import Logo from '../components/Logo.jsx';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); // To show the success message

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear any old messages

    try {
      // Call our new backend endpoint
      const response = await api.post('/api/sellers/forgot-password', { email });
      setMessage(response.data.msg); // Show the success message from the server
    } catch (err) {
      console.error('Error requesting reset:', err);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.logoWrapper}>
        <Logo simple={true} />
      </div>
      <h2>Forgot Password?</h2>
      <p className={styles.tagline}>
        Enter your email and we'll send you a reset link.
      </p>

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
        <button type="submit" className={styles.formButton}>Send Reset Link</button>
      </form>

      {message && (
        <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{message}</p>
      )}

      <Link to="/login" style={{ display: 'block', marginTop: '15px' }}>
        &larr; Back to Login
      </Link>
    </div>
  );
}

export default ForgotPassword;