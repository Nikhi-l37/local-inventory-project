import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Import our CSS Module
import styles from './ShopLocation.module.css';

// (Icon fix is perfect, no change)
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

function ShopLocation({ shop }) {
  const position = [shop.latitude, shop.longitude];

  return (
    // 2. Apply the CSS module classes
    <div className={styles.locationContainer}>
      <h4>Your Registered Shop Location</h4>
      <p>This is where your shop appears on the map for buyers.</p>

      {shop.town_village ? (
        <div className={styles.addressDisplay}>
          {shop.town_village}, {shop.mandal}, {shop.district}, {shop.state}
        </div>
      ) : (
        <div className={styles.addressDisplay}>
          Address data not found for this shop.
        </div>
      )}

      <MapContainer 
        center={position} 
        zoom={15} 
        className={styles.mapContainer}
        scrollWheelZoom={false}
        touchZoom={false}
        dragging={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>Your Shop</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default ShopLocation;