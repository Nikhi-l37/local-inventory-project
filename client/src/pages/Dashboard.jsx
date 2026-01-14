import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import ShopCreator from '../components/ShopCreator.jsx';
import ShopStatus from '../components/ShopStatus.jsx';
import ProductManager from '../components/ProductManager.jsx';
import CategoryManager from '../components/CategoryManager.jsx';
import styles from './Dashboard.module.css';

// Components
import ImageUpload from '../components/ImageUpload.jsx';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Leaflet Icon Fix
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

// --- HELPERS ---
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getShopStatus = (opening, closing, is_open_override) => {
  // 1. Manual Override Check
  if (is_open_override === false) {
    return {
      text: 'Closed', // Simplified
      colorClass: 'statusClosed',
      detail: 'Manual Pause'
    };
  }

  // 2. Time Check
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  if (!opening || !closing) return { text: 'Closed', colorClass: 'statusClosed', detail: 'No Hours' };

  const [openH, openM] = opening.split(':').map(Number);
  const [closeH, closeM] = closing.split(':').map(Number);
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  if (currentTime < openTime) {
    return { text: 'Closed', colorClass: 'statusClosed', detail: `Opens ${formatTime(opening)}` };
  } else if (currentTime >= openTime && currentTime < closeTime) {
    return { text: 'Open', colorClass: 'statusOpen', detail: `Closes ${formatTime(closing)}` };
  } else {
    return { text: 'Closed', colorClass: 'statusClosed', detail: `Closed ${formatTime(closing)}` };
  }
};


// --- 1. SELLER PROFILE (No Changes to logic, just styling triggers) ---
function SellerProfile({ initialShop, onShopUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialShop.name);
  const [category, setCategory] = useState(initialShop.category);
  const [description, setDescription] = useState(initialShop.description || '');
  const [openingTime, setOpeningTime] = useState(initialShop.opening_time || '09:00');
  const [closingTime, setClosingTime] = useState(initialShop.closing_time || '21:00');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setName(initialShop.name);
    setCategory(initialShop.category);
    setDescription(initialShop.description || '');
    setOpeningTime(initialShop.opening_time || '09:00');
    setClosingTime(initialShop.closing_time || '21:00');
  }, [initialShop]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('opening_time', openingTime);
      formData.append('closing_time', closingTime);
      if (image) formData.append('image', image);

      const response = await api.patch('/api/shops/update-details', formData);
      onShopUpdated(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating shop:', err);
      alert('Failed to update shop details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setStatusLoading(true);
    try {
      // Logic: If currently manually closed (false), switch to true (auto).
      // If currently auto (true), switch to false (manual close).
      const newStatus = !initialShop.is_open;
      const response = await api.patch('/api/shops/status', { is_open: newStatus });
      onShopUpdated(response.data);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Calculate Status
  const status = getShopStatus(initialShop.opening_time, initialShop.closing_time, initialShop.is_open);

  return (
    <div className={styles.sidebarCard}>
      <div className={styles.profileHeader}>
        <div className={styles.profileImageContainer}>
          {initialShop.image_url ? (
            <img src={`${import.meta.env.VITE_API_BASE_URL}${initialShop.image_url}`} alt="Shop Logo" className={styles.avatar} />
          ) : <div className={styles.placeholderAvatar}>{initialShop.name[0]}</div>}
          {/* Edit Overlay */}
          <button onClick={() => setIsEditing(true)} className={styles.editIconBtn} title="Edit Profile">✏️</button>
        </div>

        <div className={styles.profileInfo}>
          <h3>{initialShop.name}</h3>

          {/* STATUS TOGGLE BUTTON */}
          <button
            onClick={handleToggleStatus}
            disabled={statusLoading}
            className={`${styles.statusToggleBtn} ${styles[status.colorClass]}`}
            title={initialShop.is_open ? "Click to Manually Close" : "Click to Resume Orders"}
          >
            {statusLoading ? '...' : (initialShop.is_open ? `● ${status.text}` : `● ${status.text}`)}
          </button>

          <span className={styles.statusDetail}>
            {initialShop.is_open ? status.detail : "Click to Enable Shop"}
          </span>

        </div>
      </div>

      {isEditing && createPortal(
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Edit Shop Profile</h3>
            <div className={styles.editForm}>
              <div className={styles.editFormScrollable}>
                <div className={styles.formGroup}>
                  <ImageUpload label="Shop Logo" currentImage={initialShop.image_url} onImageSelect={setImage} />
                </div>

                <div className={styles.formGroup}>
                  <label>Shop Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My Awesome Shop" />
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select value={['Grocery', 'Electronics', 'Pharmacy', 'Fashion'].includes(category) ? category : 'Other'}
                    onChange={e => setCategory(e.target.value)}>
                    <option value="Grocery">Grocery</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>

                {(!['Grocery', 'Electronics', 'Pharmacy', 'Fashion'].includes(category)) && (
                  <div className={styles.formGroup}>
                    <label>Custom Category Name</label>
                    <input
                      type="text"
                      value={category === 'Other' ? '' : category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="Enter custom category name"
                      autoFocus
                    />
                  </div>
                )}

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Opens At</label>
                    <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Closes At</label>
                    <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description (Optional)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder="Tell customers about your shop..." />
                </div>

                <div className={styles.modalActions}>
                  <button onClick={() => setIsEditing(false)} className={styles.secondaryButton}>Cancel</button>
                  <button onClick={handleSave} className={styles.primaryButton} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// --- 2. LOCATION MANAGER (Sidebar Widget) ---
function LocationManager({ shop, onShopUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  // ... (Keep logic same, minimize UI)
  const [position, setPosition] = useState([shop.latitude, shop.longitude]);
  const [address, setAddress] = useState({
    town: shop.town_village,
    mandal: shop.mandal,
    district: shop.district,
    state: shop.state
  });
  const [loading, setLoading] = useState(false);

  // Map Click Handler
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        fetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });
    return position ? <Marker position={position}><Popup>New Location</Popup></Marker> : null;
  }

  const fetchAddress = async (lat, lng) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`);
      const addr = res.data.address;
      setAddress({
        town: addr.village || addr.town || addr.city_district || 'N/A',
        mandal: addr.county || addr.subdistrict || 'N/A',
        district: addr.state_district || 'N/A',
        state: addr.state || 'N/A'
      });
    } catch (err) { console.error(err); }
  };

  const handleSaveLocation = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/api/shops/update-location', {
        latitude: position[0],
        longitude: position[1],
        town_village: address.town,
        mandal: address.mandal,
        district: address.district,
        state: address.state
      });
      onShopUpdated(res.data);
      setIsEditing(false);
    } catch (err) { console.error(err); alert('Failed to update location'); } finally { setLoading(false); }
  };

  return (
    <div className={styles.sidebarCard}>
      <div className={styles.cardHeader}>
        <h4>Location</h4>
        <button onClick={() => setIsEditing(true)} className={styles.iconBtn}>📍</button>
      </div>
      <p className={styles.addressText}>
        {shop.town_village}, {shop.mandal}
      </p>
      {isEditing && createPortal(
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Update Location</h3>
            <div className={styles.mapContainer}>
              <MapContainer center={[shop.latitude, shop.longitude]} zoom={13} className={styles.editMap}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker />
              </MapContainer>
            </div>
            <div className={styles.addressPreview}>
              <p>{address.town}, {address.mandal}</p>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setIsEditing(false)} className={styles.secondaryButton}>Cancel</button>
              <button onClick={handleSaveLocation} className={styles.primaryButton} disabled={loading}>Confirm Location</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// --- 3. STATS WIDGET ---
function StatsWidget({ totalCategories, activeProducts, inactiveProducts }) {
  return (
    <div className={styles.sidebarCard}>
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{totalCategories}</span>
          <span className={styles.statLabel}>Categories</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue} style={{ color: 'var(--success-color)' }}>{activeProducts}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue} style={{ color: 'var(--danger-color)' }}>{inactiveProducts}</span>
          <span className={styles.statLabel}>Inactive</span>
        </div>
      </div>
    </div>
  )
}


function Dashboard() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // V4 State Lifting
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [shopStats, setShopStats] = useState({ total: 0, active: 0, inactive: 0 }); // Added inactive

  useEffect(() => {
    fetchShopAndCategories();
  }, []);

  const fetchShopAndCategories = async () => {
    try {
      // Parallel Fetch
      const shopRes = await api.get('/api/shops/my-shop');
      setShop(shopRes.data);

      // Only fetch categories if shop exists
      if (shopRes.data) {
        const catRes = await api.get(`/api/categories/shop/${shopRes.data.id}`);
        setCategories(catRes.data);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setShop(null);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    if (!shop) return;
    const res = await api.get(`/api/categories/shop/${shop.id}`);
    setCategories(res.data);
  };

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

  return (
    <div className={styles.dashboardContainer}>
      {shop ? (
        <div className={styles.layoutGrid}>
          {/* --- SIDEBAR --- */}
          <aside className={styles.sidebar}>
            <SellerProfile initialShop={shop} onShopUpdated={s => setShop(prev => ({ ...prev, ...s }))} />

            <StatsWidget
              totalCategories={categories.length}
              activeProducts={shopStats.active}
              inactiveProducts={shopStats.inactive}
            />

            <div className={styles.sidebarCard}>
              <div className={styles.cardHeader}>
                <h4>Categories</h4>
                {/* Tiny Add Button */}
                <button className={styles.iconBtn} title="Manage Categories" onClick={() => setSelectedCategory('manage')}>⚙️</button>
              </div>
              <nav className={styles.categoryNav}>
                <button
                  className={selectedCategory === 'All' ? styles.activeCat : ''}
                  onClick={() => setSelectedCategory('All')}
                >
                  All Products
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={selectedCategory === cat.id ? styles.activeCat : ''}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>

            <LocationManager shop={shop} onShopUpdated={s => setShop(prev => ({ ...prev, ...s }))} />
          </aside>

          {/* --- MAIN CONTENT --- */}
          <main className={styles.mainContent}>
            {selectedCategory === 'manage' ? (
              <CategoryManager shop={shop} onCategoriesChange={refreshCategories} />
            ) : (
              <ProductManager
                shop={shop}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoriesChange={refreshCategories}
                onStatsUpdate={setShopStats}
              />
            )}
          </main>
        </div>
      ) : (
        <ShopCreator onShopCreated={setShop} />
      )}
    </div>
  );
}

export default Dashboard;