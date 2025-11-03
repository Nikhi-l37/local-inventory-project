import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import axios from 'axios'; // To call the geocoding API
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './ShopCreator.module.css';

// (Leaflet icon fix)
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to find location
function LocationFinder({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng); // e.latlng is { lat, lng }
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Click on the map to move this pin</Popup>
    </Marker>
  );
}

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

    const shopData = {
      name,
      category,
      latitude: position.lat,
      longitude: position.lng,
      ...addressData 
    };

    try {
      const response = await api.post('/api/shops', shopData);
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
  return (
    <div className={styles.creatorContainer}>
      <h3>Create Your Shop</h3>
      <p>Click on the map to place the pin *exactly* where your shop is.</p>
      
      <div className={styles.formGroup}>
        <label>Shop Name: </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.formInput}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Category: </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.formSelect}>
          <option value="Grocery">Grocery</option>
          <option value="Electronics">Electronics</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <MapContainer 
        center={position} 
        zoom={15} 
        className={styles.mapContainer}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationFinder position={position} setPosition={handleMapClick} />
      </MapContainer>

      {/* Display the auto-found address */}
      <div className={styles.addressDisplay}>
        {addressLoading ? (
          <p>Finding address for this location...</p>
        ) : address ? (
          <>
            <strong>Location:</strong> {address.town_village}, {address.mandal}, {address.district}, {address.state}
          </>
        ) : (
          <p>Could not find address for this location.</p>
        )}
      </div>
      
      <button 
        onClick={handleSubmit} 
        disabled={loading || addressLoading} 
        className={styles.createButton}
      >
        {loading ? 'Saving...' : 'Create Shop'}
      </button>
    </div>
  );
}

export default ShopCreator;