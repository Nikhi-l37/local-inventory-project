import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import axios from 'axios'; // To call the geocoding API

import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import ImageUpload from './ImageUpload'; // Import ImageUpload
import styles from './ShopCreator.module.css';

// Leaflet icon fix removed

// Helper component to find location
// LocationFinder removed (not needed for Mapbox)

// Our new ShopCreator
function ShopCreator({ onShopCreated }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [position, setPosition] = useState(null); // The pin's lat/lng
  const [address, setAddress] = useState(null); // The new address state
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // 1. Get user's GPS location on load to center map
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(coords);
        fetchAddress(coords); // Automatically find address for their location
      },
      () => {
        console.error("Failed to get location, defaulting.");
        const defaultCoords = { lat: 17.3850, lng: 78.4867 };
        setPosition(defaultCoords);
        fetchAddress(defaultCoords); // Find address for default location
      }
    );
  }, []);

  // Search for locations using Mapbox Geocoding API
  const searchLocation = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: import.meta.env.VITE_MAPBOX_TOKEN,
            limit: 5,
            types: 'place,locality,neighborhood,address'
          }
        }
      );

      setSearchResults(response.data.features || []);
    } catch (err) {
      console.error('Error searching location:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query);
    }, 500); // Wait 500ms after user stops typing
  };

  // Handle selecting a search result
  const handleSelectSearchResult = (result) => {
    const [lng, lat] = result.center;
    const newPos = { lat, lng };
    setPosition(newPos);
    fetchAddress(newPos);
    setSearchQuery(result.place_name);
    setSearchResults([]); // Clear results after selection
  };

  // Fetch address from coordinates using Nominatim API
  const fetchAddress = useCallback(async ({ lat, lng }) => {
    setAddressLoading(true);
    setAddress(null); // Clear old address
    try {
      // Use the Nominatim reverse geocoding API with the 'accept-language' parameter
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`
      );

      // Check if we have valid data
      if (!response.data || !response.data.address) {
        console.warn('No address data returned from geocoding API');
        setAddress(null);
        return;
      }

      const addr = response.data.address;

      // Parse the address format - set to null if not available instead of 'N/A'
      setAddress({
        town_village: addr.village || addr.town || addr.city || addr.city_district || addr.suburb || null,
        mandal: addr.county || addr.subdistrict || addr.municipality || null,
        district: addr.state_district || addr.district || null,
        state: addr.state || null,
      });
    } catch (err) {
      console.error('Error fetching address:', err);
      setAddress(null); // Set to null on error
    } finally {
      setAddressLoading(false);
    }
  }, []);
  // 3. Update position AND fetch new address when map is clicked
  const handleMapClick = (latlng) => {
    setPosition(latlng);
    fetchAddress(latlng);
  };

  // NEW STATE: Image, Description, Hours
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('21:00');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);


  // 4. Handle the final form submission
  const handleSubmit = async () => {
    if (!name || !position) {
      return alert('Please enter a shop name and set a location on the map.');
    }
    // Updated check: We can proceed even if address is null
    if (addressLoading) {
      return alert('Please wait for address to finish loading...');
    }

    setLoading(true);

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('latitude', position.lat);
    formData.append('longitude', position.lng);
    
    // Send address fields - use 'Unknown' as fallback for required fields
    formData.append('town_village', (address && address.town_village) || 'Unknown');
    formData.append('mandal', (address && address.mandal) || 'Unknown');
    formData.append('district', (address && address.district) || 'Unknown');
    formData.append('state', (address && address.state) || 'Unknown');

    // Append new fields
    formData.append('description', description);
    formData.append('opening_time', openingTime);
    formData.append('closing_time', closingTime);
    if (image) {
      formData.append('image', image);
    }

    try {
      // POST FormData (axios handles the headers automatically)
      const response = await api.post('/api/shops', formData);
      alert('Shop created successfully!');
      onShopCreated(response.data);
    } catch (err) {
      console.error('Error creating shop:', err);
      // Show more detailed error message if available
      const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Error creating shop. Please try again.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!position) {
    return <div>Finding your location to set up the map...</div>;
  }

  // 5. Our JSX (now with correct styles)
  // 5. Our New Layout
  return (
    <div className={styles.creatorContainer}>

      <div className={styles.grid}>
        {/* --- LEFT PANEL: SHOP INFO --- */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>🛒 Shop Information</h3>
            <span className={styles.subText}>Fill in the details to add your shop</span>
          </div>

          <div className={styles.formGroup}>
            <label>Shop Name <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
              placeholder="e.g. My Awesome Store"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Category <span className={styles.required}>*</span></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.formSelect}>
              <option value="Grocery">Grocery</option>
              <option value="Electronics">Electronics</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Fashion">Fashion</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Description <span className={styles.required}>*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.formTextarea}
              placeholder="Add a descriptive text about your shop..."
              rows={4}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Opening Time <span className={styles.required}>*</span></label>
              <input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} className={styles.formInput} />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Closing Time <span className={styles.required}>*</span></label>
              <input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} className={styles.formInput} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <ImageUpload
              label="Shop Image (Optional)"
              currentImage={null}
              onImageSelect={(file) => setImage(file)}
            />
          </div>
        </div>

        {/* --- RIGHT PANEL: LOCATION --- */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>📍 Location & Map</h3>
            <span className={styles.subText}>Search, click on the map, or use your current location</span>
          </div>

          {/* Search Location Input */}
          <div className={styles.formGroup} style={{ position: 'relative' }}>
            <label>Search Location</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className={styles.formInput}
              placeholder="Search for a place or address..."
            />
            {isSearching && (
              <div style={{ padding: '8px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                Searching...
              </div>
            )}
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectSearchResult(result)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: index < searchResults.length - 1 ? '1px solid var(--border-color)' : 'none',
                      fontSize: '0.9em'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ fontWeight: '500' }}>{result.text}</div>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {result.place_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.mapWrapper}>
            <Map
              initialViewState={{
                longitude: position.lng,
                latitude: position.lat,
                zoom: 14
              }}
              mapStyle="mapbox://styles/mapbox/navigation-night-v1"
              mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              onClick={(e) => {
                // Handle map click to move marker
                const newPos = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                handleMapClick(newPos);
              }}
              // Sync view state if position changes externally (like geolocation)
              {...(position ? {
                longitude: position.lng,
                latitude: position.lat
              } : {})}
              onMove={() => {
                // Optional: track view state if needed
              }}
            >
              <NavigationControl position="top-right" />
              <GeolocateControl position="top-right" />

              <Marker
                longitude={position.lng}
                latitude={position.lat}
                draggable
                onDragEnd={(e) => {
                  const newPos = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                  handleMapClick(newPos);
                }}
                color="#e53e3e" // Red color for pin
              />
            </Map>
          </div>

          <div className={styles.locationCard}>
            <span className={styles.locationIcon}>📍</span>
            <div>
              <strong>Current Location:</strong>
              <p style={{ margin: '5px 0 0', fontSize: '0.9em', color: 'var(--text-color)' }}>
                {addressLoading ? 'Finding address...' : (
                  address && address.town_village ? 
                    `${address.town_village}, ${address.mandal}, ${address.district}` : 
                    'Address not available (shop will be created with coordinates only)'
                )}
              </p>
            </div>
          </div>

          <button className={styles.useLocationBtn} onClick={() => {
            navigator.geolocation.getCurrentPosition(pos => handleMapClick({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
          }}>
            🎯 Use My Current Location
          </button>
        </div>
      </div>

      {/* --- BOTTOM BAR --- */}
      <div className={styles.bottomBar}>
        <div className={styles.barContent}>
          <h4>Ready to add your shop?</h4>
          <p>Make sure all required fields are filled before creating</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || addressLoading}
          className={styles.createButton}
        >
          {loading ? 'Creating Shop...' : 'Create Shop'}
        </button>
      </div>

    </div>
  );
}

export default ShopCreator;