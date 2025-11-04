// ...existing code...
import React, { useState, useEffect, useCallback } from 'react';
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
        <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '1.2em', cursor: 'pointer' }}>X</button>
        <h3>Products at {shop.name}</h3>
        {loading ? <p>Loading products...</p> : (
          <ul>
            {products.length > 0 ? (
              products.map((product) => (
                <li key={product.id}>
                  {product.name} (Last updated: {new Date(product.last_updated).toLocaleDateString()})
                </li>
              ))
            ) : <p>No available products found for this shop.</p>}
          </ul>
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
        
        {searchResults.map(result => (
          <Marker 
            key={result.id || result.shop_id} 
            position={[result.latitude, result.longitude]}
          >
            <Popup>
              {searchMode === 'product' ? (
                <>
                  <strong>{result.shop_name}</strong><br />
                  Product: {result.product_name}<br />
                  Status: {result.is_open ? 'OPEN' : 'CLOSED'}<br />
                  <button onClick={() => getDirections(result.latitude, result.longitude)}>Get Directions</button>
                </>
              ) : (
                <>
                  <strong>{result.name}</strong><br />
                  Status: {result.is_open ? 'OPEN' : 'CLOSED'}<br />
                  <button onClick={() => setSelectedShop({ id: result.id, name: result.name })}>See Products</button>
                  <button onClick={() => getDirections(result.latitude, result.longitude)}>Get Directions</button>
                </>
              )}
            </Popup>
          </Marker>
        ))}
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
            </div>
          )}
        </form>
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

// Modal styles (using var() to support themes)
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1000,
};
const modalContentStyle = {
  backgroundColor: 'var(--bg-secondary)', color: 'var(--text-color)',
  padding: '20px', borderRadius: '5px', minWidth: '300px', zIndex: 1001,
};

export default Home;