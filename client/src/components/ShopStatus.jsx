import React, { useState } from 'react';
import api from '../api';

// 1. This imports the styles
import styles from './ShopStatus.module.css'; 

function ShopStatus({ initialShop, onStatusChange }) {
  const [isOpen, setIsOpen] = useState(initialShop.is_open);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const newStatus = !isOpen;
    try {
      const response = await api.patch('/api/shops/status', { is_open: newStatus });
      setIsOpen(response.data.is_open);
      onStatusChange(response.data); 
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update shop status.');
    } finally {
      setLoading(false);
    }
  };

  // 2. This JSX applies the styles AND renders the button
  return (
    <div className={styles.statusContainer}>
      <p className={styles.statusText}>
        Your shop is currently: 
        <strong className={isOpen ? styles.open : styles.closed}>
          {isOpen ? ' OPEN' : ' CLOSED'}
        </strong>
      </p>

      {/* --- HERE IS THE BUTTON --- */}
      <button 
        onClick={handleToggle} 
        disabled={loading}
        className={`${styles.toggleButton} ${isOpen ? styles.open : styles.closed}`}
      >
        {loading ? 'Updating...' : (isOpen ? 'Set to CLOSED' : 'Set to OPEN')}
      </button>
    </div>
  );
}

export default ShopStatus;