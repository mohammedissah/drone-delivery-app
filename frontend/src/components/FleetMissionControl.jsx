import React, { useState } from 'react';
import { 
  Play, Pause, Home, AlertOctagon, ShieldAlert, Wind, BatteryCharging, 
  Satellite, Compass, Gauge, Radio, Package, Navigation, Layers, RefreshCw
} from 'lucide-react';
import FlightRadarMap from './FlightRadarMap';
import AttitudeIndicator from './AttitudeIndicator';
import DroneCameraFPV from './DroneCameraFPV';
import { sounds } from '../utils/soundEffects';

export default function FleetMissionControl({
  drones,
  activeDroneId,
  setActiveDroneId,
  onLaunchMission,
  onHoldMission,
  onReturnToHome,
  onEmergencyAbort,
  onResetDrone,
  flightPath,
  flightLogs
}) {
  const [followDrone, setFollowDrone] = useState(true);
  const activeDrone = drones.find(d => d.id === activeDroneId) || drones[0];
  const otherDrones = drones.filter(d => d.id !== activeDroneId);

  const getStatusBadge = (phase) => {
    switch (phase) {
      case 'EN_ROUTE':
        return <span className="badge-status badge-active"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'radar-pulse 1.5s infinite' }}></span>EN ROUTE</span>;
      case 'TAKEOFF':
        return <span className="badge-status badge-info">TAKEOFF ASCENT</span>;
      case 'HOVER_DROPZONE':
      case 'WINCH_DROP':
        return <span className="badge-status badge-warning">DELIVERY DROP</span>;
      case 'RETURN_TO_HOME':
        return <span className="badge-status badge-info">RETURNING (RTH)</span>;
      case 'PACKAGE_RELEASED':
        return <span className="badge-status badge-active">PAYLOAD RELEASED</span>;
      case 'HOLD':
        return <span className="badge-status badge-warning">HOVER HOLD</span>;
      case 'ABORT':
        return <span className="badge-status badge-danger">MISSION ABORTED</span>;
      default:
        return <span className="badge-status" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>STANDBY PAD</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Top Fleet Selector Bar */}
      <div style={{
        background: 'rgba(10, 16, 26, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Drone Fleet Tabs */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>
            FLEET ASSETS:
          </span>
          {drones.map(drone => {
            const isSelected = drone.id === activeDrone.id;
            return (
              <button
                key={drone.id}
                onClick={() => {
                  setActiveDroneId(drone.id);
                  sounds.playRadarPing();
                }}
                style={{
                  background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  color: isSelected ? '#00f2fe' : 'var(--text-muted)'
                }}
              >
                <Radio size={12} color={isSelected ? '#00f2fe' : '#64748b'} />
                <span style={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {drone.callsign} ({drone.id})
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: drone.phase === 'EN_ROUTE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: drone.phase === 'EN_ROUTE' ? '#10b981' : 'var(--text-dim)'
                }}>
                  {drone.battery}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Airspace Telemetry Indicators */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Wind size={13} color="#38bdf8" />
            <span>WIND: <strong style={{ color: '#38bdf8' }}>12 km/h NW</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Satellite size={13} color="#10b981" />
            <span>GNSS RTK: <strong style={{ color: '#10b981' }}>22 SATS (LOCKED)</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <ShieldAlert size={13} color="#00f2fe" />
            <span>GEOFENCE: <strong style={{ color: '#00f2fe' }}>CLEARED</strong></span>
          </div>
        </div>
      </div>

      {/* Main Mission Control Workstation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', flex: 1, overflow: 'hidden' }}>
        {/* Left Column: Tactical Map + Flight Event Console */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          {/* Map Container */}
          <div style={{ flex: 1, position: 'relative' }}>
            <FlightRadarMap
              activeDrone={activeDrone}
              otherDrones={otherDrones}
              flightPath={flightPath}
              customerTarget={activeDrone.order}
              followDrone={followDrone}
            />

            {/* Quick Map Floating Controls */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 500,
              display: 'flex',
              gap: 8
            }}>
              <button
                onClick={() => setFollowDrone(!followDrone)}
                className="btn-aerospace"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  background: followDrone ? 'rgba(0, 242, 254, 0.25)' : 'rgba(15, 23, 42, 0.85)'
                }}
              >
                <Navigation size={12} />
                {followDrone ? 'CAMERA: LOCKED TO DRONE' : 'CAMERA: FREE PAN'}
              </button>
            </div>
          </div>

          {/* Bottom Flight Telemetry Event Log */}
          <div style={{
            height: 110,
            background: 'rgba(6, 10, 16, 0.95)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            flexShrink: 0
          }}>
            <div style={{ color: 'var(--text-dim)', marginBottom: 4, fontWeight: 700, letterSpacing: '0.05em' }}>
              AUTONOMOUS MISSION LOG // MAVLINK TELEMETRY STREAM:
            </div>
            {flightLogs.map((log, idx) => (
              <div key={idx} style={{ color: log.type === 'alert' ? '#fb7185' : log.type === 'success' ? '#34d399' : '#94a3b8', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--text-dim)' }}>[{log.timestamp}]</span> {log.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Avionics, Gimbal Camera & Emergency Commands */}
        <div style={{
          background: 'rgba(8, 14, 24, 0.95)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '12px 14px',
          gap: 12
        }}>
          {/* Drone Header Card */}
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                  {activeDrone.callsign}
                </h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {activeDrone.model} · ID: {activeDrone.id}
                </span>
              </div>
              {getStatusBadge(activeDrone.phase)}
            </div>

            {/* Mission Progress Bar */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>MISSION TRAJECTORY</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#00f2fe' }}>{activeDrone.progress.toFixed(0)}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${activeDrone.progress}%`,
                  background: 'linear-gradient(90deg, #00f2fe, #10b981)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* FPV Camera Downlink */}
          <DroneCameraFPV drone={activeDrone} />

          {/* Artificial Horizon (Attitude Indicator) & Avionics */}
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: 8 }}>
              AVIONICS & ATTITUDE INDICATOR
            </div>

            <AttitudeIndicator
              pitch={activeDrone.pitchDeg}
              roll={activeDrone.rollDeg}
              heading={activeDrone.headingDeg}
              altitude={activeDrone.altitudeMeters}
              speed={activeDrone.speedKmh}
            />

            {/* Primary Flight Telemetry Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              marginTop: 10,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem'
            }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', display: 'block' }}>ALTITUDE (AGL)</span>
                <strong style={{ color: '#00f2fe', fontSize: '0.95rem' }}>{activeDrone.altitudeMeters.toFixed(1)} m</strong>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', display: 'block' }}>AIRSPEED</span>
                <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{activeDrone.speedKmh.toFixed(1)} km/h</strong>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', display: 'block' }}>BATTERY LEVEL</span>
                <strong style={{ color: activeDrone.battery > 30 ? '#10b981' : '#f59e0b', fontSize: '0.95rem' }}>
                  {activeDrone.battery}% ({activeDrone.voltage.toFixed(1)}V)
                </strong>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', display: 'block' }}>TETHER WINCH</span>
                <strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>{activeDrone.tetherLengthM.toFixed(1)} m</strong>
              </div>
            </div>
          </div>

          {/* Current Payload / Order Card */}
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6 }}>
              <Package size={14} color="#00f2fe" />
              PAYLOAD BAY STATUS: SECURED
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
              {activeDrone.order?.item || 'Emergency Medical Supplies'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Weight: <strong style={{ color: '#38bdf8' }}>{activeDrone.order?.weightKg || 1.45} kg</strong> · Drop: {activeDrone.order?.dropZoneType || 'Backyard Lawn'}
            </div>
          </div>

          {/* Autonomous Flight Command Actions */}
          <div className="glass-panel" style={{ padding: '12px', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: 8 }}>
              AUTONOMOUS FLIGHT CONTROLS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {activeDrone.phase === 'IDLE' || activeDrone.phase === 'HOLD' || activeDrone.phase === 'LANDED' ? (
                <button
                  onClick={() => {
                    onLaunchMission();
                    sounds.playLaunch();
                  }}
                  className="btn-aerospace btn-success"
                  style={{ gridColumn: 'span 2', padding: '10px', justifyContent: 'center' }}
                >
                  <Play size={16} /> AUTHORIZE & LAUNCH FLIGHT
                </button>
              ) : (
                <button
                  onClick={() => {
                    onHoldMission();
                    sounds.playWarning();
                  }}
                  className="btn-aerospace"
                  style={{
                    padding: '10px',
                    justifyContent: 'center',
                    background: 'rgba(245, 158, 11, 0.2)',
                    borderColor: '#f59e0b',
                    color: '#fbbf24'
                  }}
                >
                  <Pause size={16} /> HOLD IN PLACE
                </button>
              )}

              <button
                onClick={() => {
                  onReturnToHome();
                  sounds.playWarning();
                }}
                className="btn-aerospace"
                style={{ padding: '10px', justifyContent: 'center', fontSize: '0.75rem' }}
              >
                <Home size={15} /> RETURN TO BASE (RTH)
              </button>

              <button
                onClick={() => {
                  onEmergencyAbort();
                  sounds.playWarning();
                }}
                className="btn-aerospace btn-danger"
                style={{ padding: '10px', justifyContent: 'center', fontSize: '0.75rem' }}
              >
                <AlertOctagon size={15} /> EMERGENCY ABORT
              </button>
            </div>

            {/* Reset / Simulate New Delivery */}
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <button
                onClick={onResetDrone}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <RefreshCw size={12} /> Reset to Launch Pad Alpha
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
