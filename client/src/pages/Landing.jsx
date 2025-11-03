import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Landing.module.css';
import Logo from '../components/Logo.jsx'; // <--- 1. IMPORT LOGO

function Landing() {
  return (
    <div className={styles.landingContainer}>
      {/* 2. USE THE LOGO COMPONENT */}
      <div className={styles.logo}>
        <Logo />
      </div>

      <p className={styles.tagline}>
        Find any product in a local store near you.
      </p>

      <div className={styles.buttonContainer}>
        <Link to="/search" className={`${styles.button} ${styles.primaryButton}`}>
          Find Products Near Me
        </Link>
        <Link to="/login" className={`${styles.button} ${styles.secondaryButton}`}>
          Seller Portal
        </Link>
      </div>
    </div>
  );
}

export default Landing;