import React, { useState } from 'react';
import { Eye, Video, Crosshair, ShieldAlert, Sun, Moon } from 'lucide-react';

export default function DroneCameraFPV({ drone }) {
  const [visionMode, setVisionMode] = useState('standard'); // standard, thermal, nightvision
  const [cameraAngle, setCameraAngle] = useState('nadir'); // nadir (downward 90°), forward (45°)

  const getFilterStyle = () => {
    if (visionMode === 'thermal') {
      return 'contrast(180%) hue-rotate(180deg) saturate(250%) invert(20%)';
    }
    if (visionMode === 'nightvision') {
      return 'contrast(150%) brightness(120%) sepia(100%) hue-rotate(85deg) saturate(300%)';
    }
    return 'none';
  };

  return (
    <div className="glass-panel" style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Header bar */}
      <div style={{
        padding: '8px 12px',
        background: 'rgba(10, 16, 26, 0.9)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Video size={14} color="#00f2fe" />
          <span style={{ fontWeight: 600, color: 'var(--text-main)', letterSpacing: '0.05em' }}>
            PAYLOAD DOWNLINK // 4K GIMBAL
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#f43f5e',
            fontSize: '0.65rem',
            fontWeight: 700
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e', animation: 'radar-pulse 1.2s infinite' }}></span>
            REC [●]
          </span>
        </div>

        {/* Vision Mode Selectors */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setVisionMode('standard')}
            style={{
              padding: '2px 6px',
              fontSize: '0.65rem',
              borderRadius: 4,
              border: visionMode === 'standard' ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.1)',
              background: visionMode === 'standard' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: visionMode === 'standard' ? '#00f2fe' : 'var(--text-dim)',
              cursor: 'pointer'
            }}
          >
            RGB
          </button>
          <button
            onClick={() => setVisionMode('thermal')}
            style={{
              padding: '2px 6px',
              fontSize: '0.65rem',
              borderRadius: 4,
              border: visionMode === 'thermal' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
              background: visionMode === 'thermal' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: visionMode === 'thermal' ? '#f59e0b' : 'var(--text-dim)',
              cursor: 'pointer'
            }}
          >
            THERMAL
          </button>
          <button
            onClick={() => setVisionMode('nightvision')}
            style={{
              padding: '2px 6px',
              fontSize: '0.65rem',
              borderRadius: 4,
              border: visionMode === 'nightvision' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
              background: visionMode === 'nightvision' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: visionMode === 'nightvision' ? '#10b981' : 'var(--text-dim)',
              cursor: 'pointer'
            }}
          >
            NIGHT
          </button>
        </div>
      </div>

      {/* Synthetic Camera Viewport */}
      <div style={{
        position: 'relative',
        height: 180,
        background: '#04070c',
        overflow: 'hidden'
      }}>
        {/* Dynamic Grid / Terrain Simulation */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.15) 0%, transparent 70%),
            linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
          filter: getFilterStyle(),
          transition: 'filter 0.3s ease'
        }}>
          {/* Target Zone Reticle in Ground Center */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 80,
            border: '1px dashed rgba(0, 242, 254, 0.4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 10,
              height: 10,
              border: '2px solid #00f2fe',
              borderRadius: '50%'
            }}></div>
          </div>
        </div>

        {/* Scanline Effect */}
        <div className="scanline-effect"></div>

        {/* HUD Crosshairs Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 10
        }}>
          {/* Top HUD Data */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: '#00f2fe'
          }}>
            <span>CAM: GIMBAL 3-AXIS</span>
            <span>ZOOM: 1.0x OPTICAL</span>
            <span>FPS: 60.0</span>
          </div>

          {/* Center Crosshair */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}>
            <Crosshair size={32} color="#00f2fe" opacity={0.7} />
          </div>

          {/* Bottom HUD Data */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: '#38bdf8'
          }}>
            <div>
              <div>LAT: {drone.lat.toFixed(5)}°N</div>
              <div>LNG: {Math.abs(drone.lng).toFixed(5)}°W</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div>AGL ALT: <strong style={{ color: '#00ff9d' }}>{drone.altitudeMeters.toFixed(1)} m</strong></div>
              <div>SPD: {drone.speedKmh.toFixed(1)} km/h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
