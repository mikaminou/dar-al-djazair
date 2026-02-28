import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function ListingMap({ latitude, longitude, title }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [longitude, latitude],
      zoom: 14,
    });

    new maplibregl.Marker({ color: '#059669' })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup().setText(title || ''))
      .addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, title]);

  if (!latitude || !longitude) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="font-bold text-gray-800 mb-3">📍 Localisation</h2>
      <div ref={mapContainer} className="rounded-xl overflow-hidden w-full" style={{ height: '280px' }} />
    </div>
  );
}