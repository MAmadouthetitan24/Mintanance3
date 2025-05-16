import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  };
  title?: string;
  markerColor?: string;
  className?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  location,
  title = 'Location',
  markerColor = 'blue',
  className = 'h-[200px] w-full'
}) => {
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center rounded-md`}>
        <p className="text-sm text-gray-500">Location data unavailable</p>
      </div>
    );
  }

  const position: [number, number] = [location.latitude, location.longitude];
  
  return (
    <div className={className}>
      <MapContainer 
        zoom={15} 
        center={position}
        style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>
            <strong>{title}</strong>
            <br />
            Lat: {location.latitude.toFixed(6)}
            <br />
            Long: {location.longitude.toFixed(6)}
            {location.accuracy && (
              <>
                <br />
                Accuracy: ±{Math.round(location.accuracy)}m
              </>
            )}
            {location.timestamp && (
              <>
                <br />
                Time: {new Date(location.timestamp).toLocaleString()}
              </>
            )}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LocationMap;