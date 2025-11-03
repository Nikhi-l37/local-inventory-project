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

// nikhi-l37/local-inventory-project/local-inventory-project-311337e0354f330c870cbcf8e0b43f1dfb388258/client/src/pages/Dashboard.jsx (Only JSX updated)

// ... (imports)

  return (
    <div>
      {shop ? (
        // Start of the new grid layout
        <div className={styles.dashboardLayout}> 
          <div className={styles.columnLeft}> {/* NEW: Column for status & location */}
            <ShopStatus 
              initialShop={shop} 
              onStatusChange={(updatedShop) => setShop(updatedShop)} 
            />
            <ShopLocation shop={shop} />
          </div>
          
          <div className={styles.columnRight}> {/* NEW: Column for product manager */}
            <ProductManager shop={shop} />
          </div>
        </div>
      ) : (
        <ShopCreator onShopCreated={(newShop) => setShop(newShop)} />
      )}
    </div>
  );
}

export default Dashboard;