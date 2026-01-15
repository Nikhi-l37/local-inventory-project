// ...existing code...
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import api from '../api';
import axios from 'axios';
import styles from './Home.module.css';

// (Leaflet icon fix)
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to format time (e.g. 14:00 -> 2:00 PM)
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

// Helper to determine status color and text
const getShopStatus = (opening, closing, isOpenOverride) => {
  // 1. Manual Override Check
  if (isOpenOverride === false) {
    return {
      text: 'Closed',
      color: '#e53e3e', // Red
      status: 'closed',
      detail: 'Manually Paused'
    };
  }

  // 2. Data Check
  if (!opening || !closing) {
    return {
      text: 'Closed',
      color: '#718096',
      status: 'unknown',
      detail: 'Hours not set'
    };
  }

  // 3. Time Calculation
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Helper to parse "HH:mm:ss" or "HH:mm"
  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const openMinutes = parseTime(opening);
  const closeMinutes = parseTime(closing);

  // 4. Status Determination
  if (currentMinutes < openMinutes) {
    return { text: 'Closed', color: '#e53e3e', status: 'closed', detail: `Opens ${formatTime(opening)}` };

  } else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return { text: 'Open', color: '#38a169', status: 'open', detail: `Closes ${formatTime(closing)}` }; // Green

  } else {
    return { text: 'Closed', color: '#e53e3e', status: 'closed', detail: `Closed at ${formatTime(closing)}` };
  }
};

function ProductListModal({ shop, onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get(`/api/products/shop/${shop.id}`);
        setProducts(response.data);
      } catch (err) { console.error("Error fetching products", err); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [shop.id]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{shop.name}</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        {/* Shop Image Removed per user request */}
        <p className={styles.modalSubtitle}>{shop.category} • {shop.town_village}</p>
        <p style={{ marginBottom: '20px', color: '#555' }}>{shop.description}</p>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />

        <h4>Products ({products.length})</h4>
        {loading ? <p>Loading products...</p> : (
          <div className={styles.modalProductList}>
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className={styles.modalProductItem}>
                  {/* Product Image removed */}
                  <div className={styles.modalProductInfo} style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '1rem', color: '#333' }}>{product.name}</strong>
                      <span className={styles.price} style={{ fontWeight: 'bold', color: '#059669' }}>{product.price ? `₹${product.price}` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85em', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#666' }}>{product.category}</span>
                      <div className={styles.statusBadge} style={{ fontSize: '0.75em', padding: '2px 6px', backgroundColor: product.is_available ? '#d1fae5' : '#fee2e2', color: product.is_available ? '#065f46' : '#991b1b' }}>
                        {product.is_available ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </div>
                    {product.description && <p style={{ margin: '6px 0 0', fontSize: '0.9em', color: '#6b7280', lineHeight: '1.4' }}>{product.description}</p>}
                  </div>
                </div>
              ))
            ) : <p style={{ color: '#888', fontStyle: 'italic' }}>No available products found for this shop.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeMapView({ center, bounds }) {
  const map = useMap();

  // Re-center when center coordinate changes (e.g. clicking a result or location)
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() < 14 ? 14 : map.getZoom());
    }
  }, [center, map]);

  // Fit bounds when search results arrive
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [bounds, map]);

  return null;
}

function Home() {
  const navigate = useNavigate(); // <-- This uses the correct import
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]);
  const [mapBounds, setMapBounds] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('product');
  const [openOnly, setOpenOnly] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10000); // Default 10km
  const [searchResults, setSearchResults] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);

  const [searchPanelOpen, setSearchPanelOpen] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userCoords = { lat: latitude, lon: longitude };
        setUserLocation(userCoords);
        setMapCenter([latitude, longitude]);
        setLocationQuery('Your Current Location');
        setSelectedLocation(userCoords);
      },
      () => {
        console.error("Error getting location. Using default Hyderabad.");
        setSelectedLocation({ lat: 17.3850, lon: 78.4867 });
        setLocationQuery('Hyderabad');
      }
    );
  }, []);

  useEffect(() => {
    if (!locationQuery || locationQuery === 'Your Current Location') {
      setLocationSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const response = await axios.get(
          `https://geocoding-api.open-meteo.com/v1/search?name=${locationQuery}&count=5&language=en`
        );
        if (response.data.results) {
          setLocationSuggestions(response.data.results);
        } else {
          setLocationSuggestions([]);
        }
      } catch (err) {
        console.error("Error fetching location suggestions:", err);
        setLocationSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [locationQuery]);

  const handleSuggestionClick = (suggestion) => {
    const coords = { lat: suggestion.latitude, lon: suggestion.longitude };
    setLocationQuery(`${suggestion.name}, ${suggestion.admin1 || ''}, ${suggestion.country_code || ''}`.replace(/, ,/g, ',').replace(/,,/g, ',').trim());
    setSelectedLocation(coords);
    setMapCenter([suggestion.latitude, suggestion.longitude]);
    setLocationSuggestions([]);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery || !selectedLocation) {
      alert("Please enter a search term and select a location.");
      return;
    }

    const params = {
      q: searchQuery,
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      open_only: openOnly,
      radius: searchRadius,
    };

    try {
      let response;
      if (searchMode === 'product') {
        response = await api.get('/api/search', { params });
      } else {
        response = await api.get('/api/search/shops', { params });
      }
      setSearchResults(response.data);
      if (response.data.length === 0) {
        alert('No results found for your search.');
      } else {
        // SUCCESS: Auto-close search panel
        setSearchPanelOpen(false);

        // Auto-fit map to show all results
        const lats = response.data.map(item => item.latitude);
        const lons = response.data.map(item => item.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        // If only 1 result, just set bounds to small area or rely on center button interaction?
        // Actually fitBounds works fine even for one point if maxZoom is set.
        setMapBounds([[minLat, minLon], [maxLat, maxLon]]);
      }
    } catch (err) {
      console.error('Error searching:', err);
      alert('Failed to perform search. Please try again.');
    }
  };

  const getDirections = (lat, lon) => {
    if (!userLocation) {
      alert("Could not get your current location to provide directions.");
      return;
    }
    const origin = `${userLocation.lat},${userLocation.lon}`;
    const destination = `${lat},${lon}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    window.open(url, '_blank');
  };

  return (
    <div className={styles.homeContainer}>

      <MapContainer
        center={mapCenter}
        zoom={14}
        className={styles.mapContainer}
      >
        <ChangeMapView center={mapCenter} bounds={mapBounds} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {searchResults.map(result => {
          const status = getShopStatus(result.opening_time, result.closing_time, result.is_open);
          const imageUrl = result.shop_image || result.image_url;

          return (
            <Marker
              key={result.id || result.shop_id}
              position={[result.latitude, result.longitude]}
            >
              <Popup className={styles.customPopup}>
                <div className={styles.popupContent}>
                  {imageUrl && (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${imageUrl}`}
                      alt="Shop"
                      className={styles.popupImage}
                    />
                  )}
                  <strong>{result.shop_name || result.name}</strong>
                  <div style={{ color: status.color, fontWeight: 'bold', fontSize: '0.9em' }}>
                    {status.text}
                  </div>

                  {searchMode === 'product' && (
                    <div className={styles.popupProduct}>
                      Product: <strong>{result.product_name}</strong>
                      {result.price && <span> - ₹{result.price}</span>}
                    </div>
                  )}

                  <div className={styles.popupActions}>
                    {searchMode === 'shop' && (
                      <button onClick={() => setSelectedShop({ ...result, image_url: imageUrl })}>See Products</button>
                    )}
                    <button onClick={() => getDirections(result.latitude, result.longitude)}>Directions</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* --- State 1: Full Search Panel (Left) --- */}
      {searchPanelOpen ? (
        <div className={styles.searchPanel}>

          <button onClick={() => navigate('/')} className={styles.backButton}>
            &larr; Back to Home
          </button>

          <div className={styles.searchGroup}>
            <label htmlFor="location-input">Location</label>
            <input
              id="location-input"
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className={styles.locationInput}
              placeholder="e.g., Hyderabad, Gachibowli..."
            />
            {locationSuggestions.length > 0 && (
              <ul className={styles.suggestionsList}>
                {locationSuggestions.map(s => (
                  <li key={s.id} onClick={() => handleSuggestionClick(s)} className={styles.suggestionItem}>
                    {s.name}{s.admin1 ? `, ${s.admin1}` : ''}{s.country_code ? `, ${s.country_code}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleSearch}>
            <div className={styles.searchMain}>
              <input
                type="text"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchMode === 'product' ? 'e.g., Milk, Soap...' : 'e.g., Nikhil Shop...'}
              />
              <button type="submit" className={styles.searchButton} aria-label="Search">🔍</button>
            </div>

            <button type="button" onClick={() => setShowFilters(!showFilters)} className={styles.filterToggle}>
              {showFilters ? 'Hide Filters ▴' : 'Show Filters ▾'}
            </button>

            {showFilters && (
              <div className={styles.filtersContent}>
                <div className={styles.searchToggles}>
                  <button
                    type="button"
                    onClick={() => setSearchMode('product')}
                    className={searchMode === 'product' ? styles.active : ''}
                  >
                    Search by Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('shop')}
                    className={searchMode === 'shop' ? styles.active : ''}
                  >
                    Search by Shop
                  </button>
                </div>

                {/* Radius Filter */}
                <div className={styles.radiusControl} style={{ marginTop: '10px', marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: '600' }}>Search Radius</label>
                  <select
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value={5000}>5 km</option>
                    <option value={10000}>10 km</option>
                    <option value={20000}>20 km</option>
                    <option value={50000}>50 km</option>
                    <option value={100000}>100 km</option>
                  </select>
                </div>

                <div className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    id="openOnly"
                    checked={openOnly}
                    onChange={(e) => setOpenOnly(e.target.checked)}
                  />
                  <label htmlFor="openOnly">Only show open shops</label>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : (
        /* --- State 2: Mini Search Button (Left) --- */
        <button className={styles.miniSearchBtn} onClick={() => setSearchPanelOpen(true)} title="Open Search">
          🔍 Search Again
        </button>
      )}

      {/* --- State 3: Results Panel (Right) - Only when search is closed & results exist --- */}
      {!searchPanelOpen && searchResults.length > 0 && (
        <div className={styles.resultsPanel}>
          <div className={styles.resultsHeader}>
            <h3>Results ({searchResults.length})</h3>
            <button onClick={() => setSearchPanelOpen(true)} className={styles.closeResultsBtn}>×</button>
          </div>
          <div className={styles.resultsList}>
            {searchResults.map(result => {
              const status = getShopStatus(result.opening_time, result.closing_time, result.is_open);
              const imageUrl = result.shop_image || result.image_url;

              return (
                <div
                  key={result.id || result.shop_id}
                  className={styles.resultCard}
                  onClick={() => {
                    setMapCenter([result.latitude, result.longitude]);
                  }}
                >
                  <div className={styles.cardHeader}>
                    {imageUrl ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL}${imageUrl}`} alt="shop" className={styles.cardImage} />
                    ) : <div className={styles.cardPlaceholder}></div>}
                    <div className={styles.cardInfo}>
                      <h4>{result.shop_name || result.name}</h4>
                      <span style={{ color: status.color, fontSize: '0.85em', fontWeight: 'bold' }}>{status.text}</span>
                      <span className={styles.distance}>{Math.round(result.distance_meters / 100) / 10} km away</span>
                    </div>
                  </div>

                  {searchMode === 'product' && (
                    <div className={styles.cardProduct}>
                      <span>Found: <strong>{result.product_name}</strong></span>
                      {result.price && <span className={styles.cardPrice}>₹{result.price}</span>}
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    {searchMode === 'shop' && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedShop({ ...result, image_url: imageUrl }); }}>View Products</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); getDirections(result.latitude, result.longitude); }}>Go</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedShop && (
        <ProductListModal
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
        />
      )}
    </div>
  );
}

export default Home;