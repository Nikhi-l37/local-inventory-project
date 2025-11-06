import React, { useState, useEffect } from 'react'; 
import api from '../api'; 
import ShopCreator from '../components/ShopCreator.jsx';
import ShopStatus from '../components/ShopStatus.jsx'; 
import ProductManager from '../components/ProductManager.jsx';
import ShopLocation from '../components/ShopLocation.jsx'; 

import styles from './Dashboard.module.css'; // <-- FIX: Ensure CSS module is imported

// --- NEW PROFILE COMPONENT with EDITING LOGIC ---
function SellerProfile({ initialShop, onShopUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialShop.name);
  const [category, setCategory] = useState(initialShop.category);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // NOTE: This API route '/update-details' still needs to be created on the server for full functionality!
      const response = await api.patch('/api/shops/update-details', { name, category }); 
      onShopUpdated(response.data); 
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating shop:', err);
      alert('Failed to update shop details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.profileContainer}>
      <h3>Shop Details</h3>
      
      <div className={styles.detailGroup}>
        <strong>Email:</strong> 
        {/* FIX: Using the real seller_email field returned by the server */}
        <span>{initialShop.seller_email || 'Not available'}</span> 
      </div>

      {isEditing ? (
        <>
          <div className={styles.detailGroup}>
            <strong>Shop Name:</strong>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={styles.profileInput} />
          </div>
          <div className={styles.detailGroup}>
            <strong>Category:</strong>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.profileSelect}>
              <option value="Grocery">Grocery</option>
              <option value="Electronics">Electronics</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div className={styles.detailGroup}>
            <strong>Shop Name:</strong> <span>{initialShop.name}</span>
          </div>
          <div className={styles.detailGroup}>
            <strong>Category:</strong> <span>{initialShop.category}</span>
          </div>
        </>
      )}

      <button 
        onClick={isEditing ? handleSave : () => setIsEditing(true)}
        disabled={loading}
        className={styles.profileButton}
      >
        {loading ? 'Saving...' : (isEditing ? 'Save Details' : 'Edit Details')}
      </button>
      {isEditing && (
        <button onClick={() => { setIsEditing(false); setName(initialShop.name); setCategory(initialShop.category); }} className={styles.cancelButton}>
          Cancel
        </button>
      )}
    </div>
  );
}

function Dashboard() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect fetches shop, remains the same
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await api.get('/api/shops/my-shop');
        setShop(response.data); // <-- FIX: Use the complete data object from the server
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

  if (loading) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  return (
    <div>
      <div className={styles.dashboardHeader}>
        <h2>Seller Dashboard</h2>
      </div>

      {shop ? (
        <div className={styles.dashboardStack}> 
          
          <div className={styles.topSection}>
            <SellerProfile 
              initialShop={shop} 
              onShopUpdated={(updatedShop) => setShop({ ...updatedShop, seller_email: shop.seller_email })} 
            />
            <ShopLocation shop={shop} />
          </div>

          <div className={styles.middleSection}>
            <ShopStatus 
              initialShop={shop} 
              onStatusChange={(updatedShop) => setShop({ ...updatedShop, seller_email: shop.seller_email })} 
            />
          </div>

          <div className={styles.bottomSection}>
            <ProductManager shop={shop} />
          </div>

        </div>
      ) : (
        <div>
          {/* Ensure ShopCreator passes the actual new shop data, including email if returned */}
          <ShopCreator onShopCreated={(newShop) => setShop(newShop)} /> 
        </div>
      )}
    </div>
  );
}

export default Dashboard;