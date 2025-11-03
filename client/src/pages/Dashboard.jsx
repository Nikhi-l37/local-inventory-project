import React, { useState, useEffect } from 'react';
import api from '../api'; 
import ShopCreator from '../components/ShopCreator.jsx';
import ShopStatus from '../components/ShopStatus.jsx'; 
import ProductManager from '../components/ProductManager.jsx';
import ShopLocation from '../components/ShopLocation.jsx'; 

// 1. Import the new CSS module
import styles from './Dashboard.module.css';

function Dashboard() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... (useEffect logic is perfect, no change)
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await api.get('/api/shops/my-shop');
        setShop(response.data); 
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setShop(null);
        } else {
          console.error('Error fetching shop:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, []); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // 2. Apply the 'loading' style
  if (loading) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  return (
    <div>
      {/* 3. Apply the header styles */}
      {shop ? (
        <div className={styles.dashboardHeader}>
          <h2>{shop.name} ({shop.category})</h2>
          {/* We can remove this button, it's in the main navbar now */}
          {/* <button onClick={handleLogout} className={styles.logoutButton}>Logout</button> */}
        </div>
      ) : (
        <div className={styles.dashboardHeader}>
          <h2>Seller Dashboard</h2>
          {/* <button onClick={handleLogout} className={styles.logoutButton}>Logout</button> */}
        </div>
      )}

      {shop ? (
        <div>
          <ShopLocation shop={shop} />
          <ShopStatus 
            initialShop={shop} 
            onStatusChange={(updatedShop) => setShop(updatedShop)} 
          />
          <ProductManager shop={shop} />
        </div>
      ) : (
        <div>
          <ShopCreator onShopCreated={(newShop) => setShop(newShop)} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;