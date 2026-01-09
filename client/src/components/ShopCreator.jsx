import React, { useState, useEffect, useCallback } from 'react';
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
  }, []); // Runs once

  // 2. *** THIS IS THE FIXED FUNCTION ***
  // It now uses the Nominatim API
  // 2. *** THIS IS THE FIXED FUNCTION ***
  // It now requests English
  const fetchAddress = useCallback(async ({ lat, lng }) => {
    setAddressLoading(true);
    setAddress(null); // Clear old address
    try {
      // Use the Nominatim reverse geocoding API with the 'accept-language' parameter
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`
      );

      const addr = response.data.address;

      // Parse the new address format
      setAddress({
        town_village: addr.village || addr.town || addr.city_district || 'N/A',
        mandal: addr.county || addr.subdistrict || 'N/A',
        district: addr.state_district || 'N/A',
        state: addr.state || 'N/A',
      });
    } catch (err) {
      console.error('Error fetching address:', err);
      setAddress(null); // Set to null on error
    } finally {
      setAddressLoading(false);
    }
  }, []); // We pass 'fetchAddress' as a dependency
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

    const addressData = address ? {
      town_village: address.town_village,
      mandal: address.mandal,
      district: address.district,
      state: address.state,
    } : {
      town_village: null,
      mandal: null,
      district: null,
      state: null,
    };

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('latitude', position.lat);
    formData.append('longitude', position.lng);
    formData.append('town_village', addressData.town_village || '');
    formData.append('mandal', addressData.mandal || '');
    formData.append('district', addressData.district || '');
    formData.append('state', addressData.state || '');

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
      alert('Error creating shop.');
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
            <span className={styles.subText}>Click on the map to set your shop location</span>
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
              onMove={evt => { /* Optional: track view state if needed */ }}
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
                {addressLoading ? 'Finding address...' : (address ? `${address.town_village}, ${address.mandal}, ${address.district}` : 'Click map to select')}
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