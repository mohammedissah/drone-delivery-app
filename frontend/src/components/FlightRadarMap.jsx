import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Globe, Map as MapIcon, Crosshair } from 'lucide-react';
import { SKYPORT_COORDINATES, NO_FLY_ZONES } from '../utils/droneSimulator';

const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    name: 'Tactical Radar'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satellite Aerial'
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'Street Map'
  }
};

export default function FlightRadarMap({
  activeDrone,
  otherDrones = [],
  flightPath = [],
  customerTarget,
  followDrone = true,
  onMapClick,
  height = '100%'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const droneMarkerRef = useRef(null);
  const flightPathPolylineRef = useRef(null);
  const otherDroneMarkersRef = useRef({});
  const dropZoneMarkerRef = useRef(null);
  const [currentLayer, setCurrentLayer] = useState('dark');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [activeDrone.lat, activeDrone.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Base Tile Layer
      const baseLayer = L.tileLayer(TILE_LAYERS[currentLayer].url, {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);
      tileLayerRef.current = baseLayer;

      // Add Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // SkyPort Depot Hub Marker
      const skyportIcon = L.divIcon({
        className: 'custom-hub-icon',
        html: `
          <div style="
            background: #0f172a;
            border: 2px solid #38bdf8;
            border-radius: 8px;
            padding: 4px 8px;
            color: #38bdf8;
            font-family: 'Outfit', sans-serif;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
            white-space: nowrap;
          ">
            <span>🏭</span> SKYPORT ALPHA
          </div>
        `,
        iconSize: [120, 28],
        iconAnchor: [60, 14]
      });

      L.marker([SKYPORT_COORDINATES.lat, SKYPORT_COORDINATES.lng], { icon: skyportIcon })
        .addTo(map)
        .bindPopup(`<b>SkyPort Central Hub</b><br>Depot Elevation: 12m<br>Automated Launch Pad #1`);

      // Draw No-Fly Restricted Airspace Zones
      NO_FLY_ZONES.forEach(nfz => {
        const circle = L.circle([nfz.lat, nfz.lng], {
          radius: nfz.radius,
          color: '#f43f5e',
          weight: 1.5,
          dashArray: '4, 6',
          fillColor: '#f43f5e',
          fillOpacity: 0.18
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; color: #f8fafc;">
            <b style="color: #fb7185;">⛔ RESTRICTED AIRSPACE</b><br/>
            <b>${nfz.name}</b><br/>
            <span style="font-size: 12px; color: #cbd5e1;">${nfz.reason}</span><br/>
            <span style="font-size: 11px; color: #94a3b8;">Radius: ${nfz.radius}m</span>
          </div>
        `);
      });

      // Click on map to place or update delivery spot
      map.on('click', (e) => {
        if (onMapClick) {
          onMapClick(e.latlng);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Tile Layer Switch
  const switchLayer = (type) => {
    setCurrentLayer(type);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(TILE_LAYERS[type].url, {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);
  };

  // Update Flight Path Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (flightPathPolylineRef.current) {
      map.removeLayer(flightPathPolylineRef.current);
    }

    if (flightPath && flightPath.length > 1) {
      const latlngs = flightPath.map(p => [p.lat, p.lng]);
      const polyline = L.polyline(latlngs, {
        color: '#00f2fe',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);

      flightPathPolylineRef.current = polyline;
    }
  }, [flightPath]);

  // Update Customer Drop Target Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !customerTarget) return;

    if (dropZoneMarkerRef.current) {
      map.removeLayer(dropZoneMarkerRef.current);
    }

    const dropIcon = L.divIcon({
      className: 'custom-drop-icon',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.25);
            border: 2px dashed #10b981;
            animation: radar-pulse 2s infinite;
          "></div>
          <div style="
            width: 16px;
            height: 16px;
            background: #10b981;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 12px #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #060a12;
            font-size: 10px;
            font-weight: 800;
          ">✓</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = L.marker([customerTarget.lat, customerTarget.lng], { icon: dropIcon })
      .addTo(map)
      .bindPopup(`
        <div style="color: #f8fafc; font-family: 'Inter', sans-serif;">
          <b style="color: #10b981;">📍 RECIPIENT DROP ZONE</b><br/>
          <strong>${customerTarget.recipient || 'Customer'}</strong><br/>
          <span>${customerTarget.address}</span><br/>
          <span style="font-size: 11px; color: #94a3b8;">Pad: ${customerTarget.dropZoneType || 'Backyard Lawn'}</span>
        </div>
      `);

    dropZoneMarkerRef.current = marker;
  }, [customerTarget]);

  // Update Active Drone Position & Rotation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeDrone) return;

    const droneHtml = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0, 242, 254, 0.25);
          border: 1px solid #00f2fe;
          animation: radar-pulse 1.8s infinite;
        "></div>
        <div style="
          transform: rotate(${activeDrone.headingDeg}deg);
          transition: transform 0.2s linear;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 10px #00f2fe);
        ">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#00f2fe" stroke-width="2">
            <circle cx="12" cy="12" r="3.5" fill="#00f2fe" />
            <polygon points="12,2 15,9 9,9" fill="#38bdf8" stroke="#38bdf8" />
            <line x1="5" y1="5" x2="19" y2="19" stroke="#38bdf8" stroke-width="2" />
            <line x1="5" y1="19" x2="19" y2="5" stroke="#38bdf8" stroke-width="2" />
            <circle cx="5" cy="5" r="2.5" fill="#0c1420" stroke="#00f2fe" />
            <circle cx="19" cy="5" r="2.5" fill="#0c1420" stroke="#00f2fe" />
            <circle cx="5" cy="19" r="2.5" fill="#0c1420" stroke="#00f2fe" />
            <circle cx="19" cy="19" r="2.5" fill="#0c1420" stroke="#00f2fe" />
          </svg>
        </div>
      </div>
    `;

    const droneIcon = L.divIcon({
      className: 'custom-drone-icon',
      html: droneHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    if (!droneMarkerRef.current) {
      droneMarkerRef.current = L.marker([activeDrone.lat, activeDrone.lng], { icon: droneIcon }).addTo(map);
    } else {
      droneMarkerRef.current.setLatLng([activeDrone.lat, activeDrone.lng]);
      droneMarkerRef.current.setIcon(droneIcon);
    }

    if (followDrone) {
      map.panTo([activeDrone.lat, activeDrone.lng], { animate: true, duration: 0.3 });
    }
  }, [activeDrone.lat, activeDrone.lng, activeDrone.headingDeg, followDrone]);

  // Update Other Fleet Drones
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    otherDrones.forEach(drone => {
      const html = `
        <div style="
          transform: rotate(${drone.headingDeg}deg);
          width: 24px;
          height: 24px;
          opacity: 0.75;
          filter: drop-shadow(0 0 5px #38bdf8);
        ">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#94a3b8" stroke-width="2">
            <circle cx="12" cy="12" r="3" fill="#64748b" />
            <polygon points="12,3 14,8 10,8" fill="#94a3b8" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="#64748b" />
            <line x1="6" y1="18" x2="18" y2="6" stroke="#64748b" />
          </svg>
        </div>
      `;
      const icon = L.divIcon({
        className: 'custom-other-drone-icon',
        html,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      if (!otherDroneMarkersRef.current[drone.id]) {
        otherDroneMarkersRef.current[drone.id] = L.marker([drone.lat, drone.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${drone.callsign} (${drone.id})</b><br/>Status: ${drone.status}<br/>Alt: ${drone.altitudeMeters}m | Batt: ${drone.battery}%`);
      } else {
        otherDroneMarkersRef.current[drone.id].setLatLng([drone.lat, drone.lng]);
        otherDroneMarkersRef.current[drone.id].setIcon(icon);
      }
    });
  }, [otherDrones]);

  return (
    <div style={{ position: 'relative', width: '100%', height: height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Top Left Airspace Status Overlay */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 500,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '0.75rem',
        color: 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
          <span style={{ color: '#38bdf8', letterSpacing: '0.05em' }}>AIRSPACE RADAR // SECTOR SF-01</span>
        </div>
        <div style={{ display: 'flex', gap: 14, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          <span><strong style={{ color: '#00f2fe' }}>─ ─</strong> Flight Corridor</span>
          <span><strong style={{ color: '#f43f5e' }}>⭕</strong> Geofence NFZ</span>
          <span><strong style={{ color: '#10b981' }}>🎯</strong> Drop Target</span>
        </div>
      </div>

      {/* Top Right Map Layer Mode Switcher (Satellite, Radar, Streets) */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 500,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        padding: '4px',
        display: 'flex',
        gap: 4
      }}>
        <button
          onClick={() => switchLayer('dark')}
          title="Tactical Dark Radar"
          style={{
            background: currentLayer === 'dark' ? 'rgba(0, 242, 254, 0.25)' : 'transparent',
            border: currentLayer === 'dark' ? '1px solid #00f2fe' : '1px solid transparent',
            borderRadius: 6,
            padding: '4px 8px',
            color: currentLayer === 'dark' ? '#00f2fe' : 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Crosshair size={12} /> RADAR
        </button>

        <button
          onClick={() => switchLayer('satellite')}
          title="Satellite Imagery"
          style={{
            background: currentLayer === 'satellite' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
            border: currentLayer === 'satellite' ? '1px solid #10b981' : '1px solid transparent',
            borderRadius: 6,
            padding: '4px 8px',
            color: currentLayer === 'satellite' ? '#10b981' : 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Globe size={12} /> SATELLITE
        </button>

        <button
          onClick={() => switchLayer('streets')}
          title="Street Map"
          style={{
            background: currentLayer === 'streets' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
            border: currentLayer === 'streets' ? '1px solid #38bdf8' : '1px solid transparent',
            borderRadius: 6,
            padding: '4px 8px',
            color: currentLayer === 'streets' ? '#38bdf8' : 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <MapIcon size={12} /> STREETS
        </button>
      </div>
    </div>
  );
}
