import React, { useState } from 'react';
import api from '../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './Form.module.css'; // Reuse our "glass" styles
import Logo from '../components/Logo.jsx';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // This hook gets the ':token' part from the URL
  const { token } = useParams(); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      // Call our new backend endpoint with the token and new password
      const response = await api.post(`/api/sellers/reset-password/${token}`, { password });

      setMessage(response.data.msg); // Show success message

      // After 3 seconds, send them to the login page
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Error resetting password:', err);
      setMessage(err.response.data.msg || 'An error occurred.');
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.logoWrapper}>
        <Logo simple={true} />
      </div>
      <h2>Reset Your Password</h2>
      <p className={styles.tagline}>Enter your new password below.</p>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>New Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.formInput}
            placeholder="••••••"
          />
        </div>
        <button type="submit" className={styles.formButton}>Reset Password</button>
      </form>

      {message && (
        <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{message}</p>
      )}

      {message && !message.includes('successfully') && (
        <Link to="/forgot-password" style={{ display: 'block', marginTop: '15px' }}>
          &larr; Request a new link
        </Link>
      )}
    </div>
  );
}

export default ResetPassword;