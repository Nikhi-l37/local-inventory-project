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
  if (isOpenOverride === false) return { text: 'Closed (Owner Only)', color: '#e53e3e' };

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  if (!opening || !closing) return { text: 'Unknown', color: '#718096' };

  const [openH, openM] = opening.split(':').map(Number);
  const [closeH, closeM] = closing.split(':').map(Number);
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  if (currentTime < openTime) {
    if (openTime - currentTime <= 60) return { text: `Opening Soon (${formatTime(opening)})`, color: '#d69e2e' }; // Orange
    return { text: `Closed (Opens ${formatTime(opening)})`, color: '#e53e3e' }; // Red
  } else if (currentTime >= openTime && currentTime < closeTime) {
    if (closeTime - currentTime <= 60) return { text: `Closing Soon (${formatTime(closing)})`, color: '#d69e2e' }; // Orange
    return { text: 'Open Now', color: '#38a169' }; // Green
  } else {
    return { text: 'Closed', color: '#e53e3e' };
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

        {shop.image_url && (
          <img src={`${import.meta.env.VITE_API_BASE_URL}${shop.image_url}`} alt={shop.name} className={styles.modalShopImage} />
        )}
        <p className={styles.modalSubtitle}>{shop.category} • {shop.town_village}</p>
        <p>{shop.description}</p>

        <hr />

        <h4>Products</h4>
        {loading ? <p>Loading products...</p> : (
          <div className={styles.modalProductList}>
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className={styles.modalProductItem}>
                  {product.image_url ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL}${product.image_url}`} alt={product.name} className={styles.productThumb} />
                  ) : <div className={styles.placeholderThumb}></div>}
                  <div className={styles.modalProductInfo}>
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                    <span className={styles.price}>{product.price ? `₹${product.price}` : ''}</span>
                  </div>
                  <div className={styles.statusBadge} style={{ backgroundColor: product.is_available ? '#c6f6d5' : '#fed7d7', color: product.is_available ? '#2f855a' : '#c53030' }}>
                    {product.is_available ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>
              ))
            ) : <p>No available products found for this shop.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

function Home() {
  const navigate = useNavigate(); // <-- This uses the correct import
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]);
  const [userLocation, setUserLocation] = useState(null);

  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('product');
  const [openOnly, setOpenOnly] = useState(false);
  const [searchRange, setSearchRange] = useState(5); // Default 5km
  const [searchResults, setSearchResults] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);

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
      range: searchRange,
    };

    try {
      let response;
      if (searchMode === 'product') {
        response = await api.get('/api/search', { params });
      } else {
        response = await api.get('/api/search/shops', { params });
      }
      setSearchResults(response.data);
      if (response.data.length === 0) alert('No results found for your search.');
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
    // This is the correct Google Maps URL
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
        <ChangeMapView center={mapCenter} />
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

      {/* --- The Floating Search Panel --- */}
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

          {/* Collapsible Filters */}
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

              <div className={styles.filterCheckbox}>
                <input
                  type="checkbox"
                  id="openOnly"
                  checked={openOnly}
                  onChange={(e) => setOpenOnly(e.target.checked)}
                />
                <label htmlFor="openOnly">Only show open shops</label>
              </div>

              <div className={styles.rangeFilter}>
                <label htmlFor="searchRange">Search Range: <strong>{searchRange} km</strong></label>
                <input
                  type="range"
                  id="searchRange"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={searchRange}
                  onChange={(e) => setSearchRange(parseFloat(e.target.value))}
                  className={styles.rangeSlider}
                />
                <div className={styles.rangeLabels}>
                  <span>0.5 km</span>
                  <span>50 km</span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* --- Results List --- */}
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